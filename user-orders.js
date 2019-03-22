const axios = require("axios");

async function getOrders(user,statuses, traceCtx) {
    const ordersUrl = `${process.env.CC_GATEWAY_URL}/electronics/users/${user}/orders`;
    console.log("ordersUrl: %s", ordersUrl)
    
    const response = await axios.get(ordersUrl,{headers:traceCtx, params:{statuses:statuses}});
    console.log(JSON.stringify(response.data, null, 2))
    return response.data;
}


module.exports = {
    main: async function (event, context) {
        
        console.log(JSON.stringify(event.data, null, 2));
        var traceCtxHeaders = extractTraceHeaders(event.extensions.request.headers)
        var uid = event.extensions.request.query.uid;
        var statuses = event.extensions.request.query.statuses || 'COMPLETED';
        var userOrders = await getOrders(uid,traceCtxHeaders)
        return userOrders;
    }
};

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