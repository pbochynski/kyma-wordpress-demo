const axios = require("axios");


async function getOrder(code,traceCtx) {
    const ordersUrl = `${process.env.CC_GATEWAY_URL}/electronics/orders/${code}`;
    console.log("orderUrl: %s", ordersUrl)
    const response = await axios.get(ordersUrl,{headers:traceCtx});
    console.log(JSON.stringify(response.data, null, 2))
    return response.data;
}


function getOrderCode(event) {
    return (event.extensions.request.query.code || event.data.code);
}

module.exports = {
    main: async function (event, context) {
        
        console.log(JSON.stringify(event.data, null, 2));
        var traceCtxHeaders = extractTraceHeaders(event.extensions.request.headers)
        var code = getOrderCode(event);
        var order = await getOrder(code, traceCtxHeaders);
        return order;
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