# Installation guide

[Install Kyma](https://kyma-project.io/docs/master/root/kyma#installation-installation) on Kubernetes cluster.
Configure kubctl with Kyma Cluster.

## Deploy Wordpress in Kyma Cluster

```
kubectl create namespace wordpress
kubectl -n wordpress apply -f wordpress/wordpress-deployment.yaml
```
Go to https://wordpress.KYMA_CLUSTER and finish installation.
Activate JSON Basic Authentication plugin.

Before you register API, edit file `wordpress-api.json`:
- change the password to the one you set during wordpress installation. 
- change the domain from wordpress.KYMA_CLUSTER to the one assigned to your kyma cluster.

Create application `wordpress` in Kyma. Establish connection using script and the token Url form the application:
```
chmod +x ./one-click-integration.sh
/one-click-integration.sh -u token_url
```

Register API:
```
curl -X POST https://gateway.$KYMA_CLUSTER/wordpress/v1/metadata/services --cert generated.pem -d @wordpress-api.json
```

Register events:
```
curl -X POST https://gateway.$KYMA_CLUSTER/wordpress/v1/metadata/services --cert generated.pem -d @wordpress-events.json
```

Important note: Release 6.1 contains a bug fixed in this pull request: https://github.com/kyma-project/kyma/pull/2386. As a workaround please edit application and change credentials type from `Basic` to `BasicAuth`

```
kubectl edit -n kyma-integration application wordpress
```


## Deploy Commerce Mock in Kyma Cluster

```
kubectl create namespace mocks
kubectl label namespace mocks env=true
kubectl -n mocks apply -f commerce-mock/commerce-mock-deployment.yaml
```

Create application `commerce`. Go to https://commerce.KYMA_CLUSTER, and connect commerce mock to commerce application.


## Bind applications to stage namespace

Go to applications and bind both (commerce and wordpress) to stage namespace. Then go to stage namespace Catalog and add Commerce Webservices, Worpress API and Worpress Events to stage namespace.

## Deploy Azure Broker

```
kubectl set env -n kyma-system deployment/core-helm-broker -e APP_REPOSITORY_URLS="https://github.com/kyma-project/bundles/releases/download/0.3.0"
```
Create secret azure-broker-data and add Azure Broker to namespace stage.



## Create Lambda

Create new lambda named `review`. Copy `review.js` content and paste as fucntion body. Copy `package.json` and paste as dependencies.
Add trigger on comment.post.v1.

## Bind lambda 

Go to service Catalog Instances view. Select commerce and bind it to review lambda with prefix `EC_`. Bind wordpress with prefix `WP_`