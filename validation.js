const axios = require("axios");

async function getOrders(user,traceCtx) {
    const ordersUrl = `${process.env.CC_GATEWAY_URL}/electronics/users/${user}/orders`;
    console.log("ordersUrl: %s", ordersUrl)
    const response = await axios.get(ordersUrl,{headers:traceCtx, params:{statuses:'COMPLETED'}});
    //console.log(JSON.stringify(response.data, null, 2))
    return Promise.all(response.data.orders.map((entry)=> getOrder(entry.code)));
}

async function getOrder(code,traceCtx) {
    const ordersUrl = `${process.env.CC_GATEWAY_URL}/electronics/orders/${code}`;
    console.log("orderUrl: %s", ordersUrl)
    const response = await axios.get(ordersUrl,{headers:traceCtx});
    //console.log(JSON.stringify(response.data, null, 2))
    return response.data;
}


function getOrderCode(event) {
    return (event.extensions.request.query.code || event.data.orderCode);
}
module.exports = {
    main: async function (event, context) {
        
        console.log(JSON.stringify(event.data, null, 2));
        var traceCtxHeaders = extractTraceHeaders(event.extensions.request.headers)
        var code = getOrderCode(event);
        var order = await getOrder(code, traceCtxHeaders);
        var uid = order.user.uid;
        var userOrders = await getOrders(uid,traceCtxHeaders)
        var previousOrders= userOrders.filter((entry)=>{return entry.code!=order.code});
        var report = orderReport(order,previousOrders);
        slackMessage(report);
        return {report:report};
    }
};

function orderReport(order, previousOrders) {
    var stats = productCodesFreq(previousOrders);
    var report=`New order ${order.code}:`
    var newItems=0;
    order.entries.forEach((entry)=>{
        report +=`\n- ${entry.product.name} : ${entry.quantity}`
        if (stats[entry.product.code]>0) {
            report += ` (${stats[entry.product.code]} so far)`
        } else {
            report += " (first order)"
            newItems+=1;
        }
    })
    if (newItems>order.entries.length/5 && newItems>1) {
        report+=`\nThere are too many entries ordered first time: ${newItems}. This order is put *on hold*`;
        orderOnHold(order.code);
    } else {
        report+=`\nThere is only ${newItems} item(s) ordered first time - *approved*`;
    }
    return report;
}

function slackMessage(message) {
    axios.post(process.env.SLACK_URL, {text:message});
}

function productCodesFreq(list) {
    return list.reduce((prev,current)=>{
         current.entries.forEach((entry)=>{prev[entry.product.code]=entry.quantity+(prev[entry.product.code] || 0)})
         return prev;
    },{})
  }

function extractTraceHeaders(headers) {
    const traceHeaders = ['x-request-id', 'x-b3-traceid', 'x-b3-spanid', 'x-b3-parentspanid', 'x-b3-sampled', 'x-b3-Flags', 'x-ot-span-context']
    var map = {};
    for (var i in traceHeaders) {
        h = traceHeaders[i]
        headerVal = headers[h]
        if (headerVal !== undefined) {
            map[h] = headerVal
        }
    }
    return map;
}
async function orderOnHold(orderCode ) {
    var body = {
        code: orderCode,
        versionID: null,
        potentiallyFraudulent: true,
        status: { code : 'CHECKED_INVALID' }
    }
    
   console.log("Saving order state");
   var postResponse =  await axios.post(`${process.env.GATEWAY_URL}/Orders`, body);
   return postResponse;
}

