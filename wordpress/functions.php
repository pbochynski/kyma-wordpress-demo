function comment_post_function( $comment_ID, $comment_approved, $commentdata ) {
  $url = 'http://wordpress-event-service-external-api.kyma-integration:8081/wordpress/v1/events';

  wp_remote_post($url, array(
    'headers'   => array('Content-Type' => 'application/json; charset=utf-8'),
    'body'      => '{
            "event-type": "comment.post",
            "event-type-version": "v1",
            "event-id": "'.gen_uuid().'",
            "event-time": "'.date("c",time()).'",
            "data": {
                "commentId": "'.$comment_ID.'",
                "commentAuthorEmail": "'.$commentdata['comment_author_email'].'",
                "commentContent": "'.$commentdata['comment_content'].'"
              },
            "_nodeFactory": {
              "_cfgBigDecimalExact": false
          }}',
    'method'    => 'POST'
    ));
}
add_action( 'comment_post', 'comment_post_function', 10, 3);


function user_registration_handler( $user_id ) {
    $url = 'http://wordpress-event-service-external-api.kyma-integration:8081/wordpress/v1/events';

  wp_remote_post($url, array(
    'headers'   => array('Content-Type' => 'application/json; charset=utf-8'),
    'body'      => '{
            "event-type": "customer.created",
            "event-type-version": "v1",
            "event-id": "'.gen_uuid().'",
            "event-time": "'.date("c",time()).'",
            "data": {
                "userId": "'.$user_id.'"
              }
            "_nodeFactory": {
              "_cfgBigDecimalExact": false
          }}',
    'method'    => 'POST'
));
}

add_action( 'user_register', 'user_registration_handler' );

function gen_uuid() {
    return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
        mt_rand( 0, 0xffff ),
        mt_rand( 0, 0x0fff ) | 0x4000,
        mt_rand( 0, 0x3fff ) | 0x8000,
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
    );
}
