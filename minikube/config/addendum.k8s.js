console.log(JSON.stringify({
    kind: 'Deployment',
    apiVersion: 'extensions/v1beta1',
    metadata: {
        name: 'addendum',
        namespace: 'addendum',
        labels: {
            name: 'addendum',
            environment: 'minikube'
        }
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
            },
            spec: {
                restartPolicy: 'Always',
                terminationGracePeriodSeconds: 5,
                dnsPolicy: 'ClusterFirst',
                containers: [{
                    name: 'logger',
                    image: 'bigeasy/addendum:kube',
                    imagePullPolicy: 'Never',
                    command: [ '/app/bin/logger' ]
                }]
            }
        }
    }
}, null, 4))
