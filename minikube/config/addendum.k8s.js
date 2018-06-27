console.log(JSON.stringify({
    kind: 'Deployment',
    apiVersion: 'extension/v1beta1',
    metadata: {
        name: 'addendum',
        namespace: 'addendum',
        labels: {
            name: 'addendum',
            environment: 'minikube'
        },
        spec: {
            replicas: 1,
            selector: {
                matchLabels: {
                    name: 'addendum',
                    environment: 'minikube'
                }
            },
            template: {
                metadata: {
                    labels: {
                        name: 'addendum',
                        environment: 'minikube'
                    }
                }
            }
        }
    }
}, null, 4))
