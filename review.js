const axios = require("axios");
const jsonpath = require("jsonpath");
const postToProduct = {5: "2054947", 11:"3514520"}

const textAuth = { 'Ocp-Apim-Subscription-Key': process.env.textAnalyticsKey };

async function isEnglish(txt, traceCtx) {
    const enExpr = "$.documents[*].detectedLanguages[?(@.score>0.9 && @.iso6391Name=='en')]"

    var response = await axios.post(`${process.env.textAnalyticsEndpoint}/languages`,
        { documents: [{ id: '1', text: txt }] }, {headers:{...textAuth,...traceCtx}})
    console.log(JSON.stringify(response.data, null, 2));
    return jsonpath.nodes(response.data, enExpr).length > 0
}

async function isPositive(txt, traceCtx) {
    const positiveExpr = "$.documents[?(@.score>0.7)]"
    var response = await axios.post(`${process.env.textAnalyticsEndpoint}/sentiment`,
        { documents: [{ id: '1', text: txt }] }, { headers: { ...textAuth, ...traceCtx } })
    console.log(JSON.stringify(response.data, null, 2));
    return jsonpath.nodes(response.data, positiveExpr).length > 0
}

async function setCommentStatus(id, status, traceCtx) {
    var commentUrl = `${process.env.WP_GATEWAY_URL}/comments/${id}?status=${status}`;
    console.log(commentUrl);
    const update = await axios.post(commentUrl, null, { headers: traceCtx });
}

module.exports = {
    main: async function (event, context) {
        console.log(JSON.stringify(event.data, null, 2));
        var traceCtxHeaders = extractTraceHeaders(event.extensions.request.headers)
        var status = "hold";
        var emoji=" :thumbsdown:";
        var english = await isEnglish( event.data.commentContent, traceCtxHeaders)
        if (english) {
            emoji=" :gb:"
            var positive = await isPositive(event.data.commentContent, traceCtxHeaders)
            if (positive) {
                status = "approved"
                emoji+=" :thumbsup:"
            } else {
                emoji+=" :thumbsdown:"
            }
        }
        setCommentStatus(event.data.commentId, status, traceCtxHeaders);
        slackMessage(event.data, emoji);
        if (status=="approved"){
            postReview(postToProduct[event.data.postId],event.data.commentContent, 5)
        }
    }
};
async function postReview(code, text, rating) {
    var headline = text.substring(0,50);
    if (headline.indexOf(".")>1) {
        headline = headline.substring(0,headline.indexOf("."))
    }
    var body = {
        "comment": text,
        "headline": headline,
        "rating": rating
      }
    console.log(JSON.stringify(body, null, 2));
    const reviewsUrl = `${process.env.CC_GATEWAY_URL}/electronics/products/${code}/reviews`;
    
    var response = await axios.post(reviewsUrl, body);
    console.log(response.data);
    return response.data;
}

function slackMessage(comment, status) {
    axios.post(process.env.SLACK_URL, {
        "attachments": [
            {
                "title": comment.commentAuthorEmail,
                "pretext": `New comment:  commentId=${comment.commentId}, postId=${comment.postId}, status: ${status}`,
                "text": comment.commentContent,
                "mrkdwn_in": [
                    "pretext"
                ]
            }
        ]
    });
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