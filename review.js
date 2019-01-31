const axios = require("axios");
const jsonpath = require("jsonpath");

const textAuth = { 'Ocp-Apim-Subscription-Key': process.env.textAnalyticsKey };

async function isCustomer(email, traceCtx) {
    const ordersUrl = `${process.env.EC_GATEWAY_URL}/electronics/users/${email}/orders`;
    console.log("ordersUrl: %s", ordersUrl)
    const response = await axios.get(ordersUrl,{headers:traceCtx});
    console.log(JSON.stringify(response.data, null, 2))
    return response.data.orders.length > 0;
}

async function isEnglish(txt, traceCtx) {
    const enExpr = "$.documents[*].detectedLanguages[?(@.score>0.9 && @.iso6391Name=='en')]"

    var response = await axios.post(`${process.env.textAnalyticsEndpoint}/languages`,
        { documents: [{ id: '1', text: txt }] }, {headers:{...textAuth,...traceCtx}})
    console.log(JSON.stringify(response.data, null, 2));
    return jsonpath.nodes(response.data, enExpr).length > 0
}

async function isPositive(txt, traceCtx) {
    const positiveExpr = "$.documents[?(@.score>0.8)]"
    var response = await axios.post(`${process.env.textAnalyticsEndpoint}/sentiment`,
        { documents: [{ id: '1', text: txt }] }, {headers:{...textAuth,...traceCtx}})
    console.log(JSON.stringify(response.data, null, 2));
    return jsonpath.nodes(response.data, positiveExpr).length > 0
}

async function setCommentStatus(id, status, traceCtx) {
    var commentUrl = `${process.env.WP_GATEWAY_URL}/comments/${id}?status=${status}`;
    console.log(commentUrl);
    const update = await axios.post(commentUrl,null,{headers:traceCtx});
}

module.exports = {
    main: async function (event, context) {
        console.log(JSON.stringify(event.data, null, 2));
        var traceCtxHeaders = extractTraceHeaders(event.extensions.request.headers)
        var status = "hold";
        var customer = await isCustomer(event.data.commentAuthorEmail, traceCtxHeaders);
        if (customer) {
            var english = await isEnglish( event.data.commentContent, traceCtxHeaders)
            if (english) {
                var positive = await isPositive(event.data.commentContent, traceCtxHeaders)
                if (positive) {
                    status = "approved"
                }
            }
        }
        setCommentStatus(event.data.commentId,status,traceCtxHeaders);
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