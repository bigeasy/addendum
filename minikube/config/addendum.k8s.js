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
                    command: [ '/app/bin/logger' ],
                    volumeMounts: [{ name: 'prolific', mountPath: '/etc/prolific' }]
                }, {
                    name: 'compassion',
                    image: 'bigeasy/addendum:kube',
                    imagePullPolicy: 'Never',
                    command: [ '/app/bin/compassion' ],
                    ports: [{ name: 'compassion', containerPort: 8486 }],
                    volumeMounts: [{ name: 'prolific', mountPath: '/etc/prolific' }]
                }, {
                    name: 'addendum',
                    image: 'bigeasy/addendum:kube',
                    imagePullPolicy: 'Never',
                    command: [ '/app/bin/addendum' ],
                    volumeMounts: [{ name: 'prolific', mountPath: '/etc/prolific' }]
                }],
                volumes: [{ name: 'prolific', configMap: { name: 'addendum.prolific' } }]
            }
        }
    }
}, null, 4))
