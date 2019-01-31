FROM wordpress:4.9-php7.2
ADD functions.php functions.php
ADD basic-auth.php basic-auth.php
ADD docker-entrypoint.sh docker-entrypoint.sh
RUN cat functions.php >> ../../../../usr/src/wordpress/wp-content/themes/twentyseventeen/functions.php
RUN cat basic-auth.php >> ../../../../usr/src/wordpress/wp-content/plugins/basic-auth.php
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
