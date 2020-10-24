const cdk = require('@aws-cdk/core');
const iam = require("@aws-cdk/aws-iam");
const ec2 = require("@aws-cdk/aws-ec2");
const s3 = require("@aws-cdk/aws-s3");
const elbv2 = require("@aws-cdk/aws-elasticloadbalancingv2");
const codedeploy = require("@aws-cdk/aws-codedeploy");
const autoscaling = require("@aws-cdk/aws-autoscaling")

class InfrastructureStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);
    const stackName = "myStack"

    const vpc = this.buildVPC(stackName);
    const lb = this.buildLoadBalancer(stackName, vpc);
    const securityGroup = this.buildSecurityGroup(stackName, vpc);
    const autoScalingGroup = this.buildAutoScalingGroup(stackName, vpc, securityGroup, lb.listener);
    const deploymentGroup = this.buildDeployment(stackName, autoScalingGroup, lb.loadBalancer);
    this.buildBucket(stackName);
  }

  buildBucket(stackName) {
    const bucket = new s3.Bucket(this, `${stackName}-bucket`, {
      bucketName: 'my-app-code-in-s3'
    }); //Build a bucket in S3 to store the code of our App
    const policy = new iam.PolicyStatement({
      actions: ["s3:*"],
      resources: [bucket.arnForObjects('*')],
    })
    policy.addAnyPrincipal();
    bucket.addToResourcePolicy(policy);
  }

  buildDeployment(stackName, autoScalingGroup, loadBalancer) {
    const application = new codedeploy.ServerApplication(this, `${stackName}-App`, {
      applicationName: 'SimpleReactApp',
    });
    return new codedeploy.ServerDeploymentGroup(this, `${stackName}-SDG`, {
      application,
      autoScalingGroups: [autoScalingGroup],
      deploymentGroupName: 'SimpleReactAppDG'
    });
  }

  buildAutoScalingGroup(stackName, vpc, securityGroup, listener) {
    // Create an AutoScaling group and add it as a load balancing target to the listener.
    const role = new iam.Role(this, `{stackName}-Role`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    });
    const asg = new autoscaling.AutoScalingGroup(this, `${stackName}-ASG`, {
      vpc,
      securityGroup,
      role,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
      minCapacity: 3,
      maxCapacity: 4,
      keyName: 'MyKeyPair',
      vpcSubnets: {subnetType: ec2.SubnetType.PUBLIC},
    });
    listener.addTargets(`${stackName}-ApplicationFleet`, {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg]
    });
    return asg;
  }

  buildSecurityGroup(stackName, vpc) {
    const securityGroup = new ec2.SecurityGroup(this, `${stackName}-SG`, {
      vpc,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    return securityGroup;
  }

  buildLoadBalancer(stackName, vpc) {
    //ApplicationLoadBalancer creation
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, `${stackName}-LB`, {
      vpc,
      internetFacing: true
    });
    // Add a listener and open up the load balancer's security group to the world.
    const listener = loadBalancer.addListener('Listener', {
      port: 80,
      open: true,
    });
    return {loadBalancer, listener};
  }

  buildVPC(stackName) {
    // The code that defines your stack goes here
    //VPC creation
    return new ec2.Vpc(this, `${stackName}-VPC`);
  }
}

module.exports = {InfrastructureStack}
