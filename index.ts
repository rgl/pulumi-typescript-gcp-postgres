import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as random from "@pulumi/random";

const config = new pulumi.Config("gcp");
const region = config.require("region");

const postgres = new gcp.sql.DatabaseInstance("postgres", {
    region: region,
    deletionProtection: false,
    databaseVersion: "POSTGRES_14",
    settings: {
        tier: "db-f1-micro",
        ipConfiguration: {
            ipv4Enabled: true,
            requireSsl: true,
            authorizedNetworks: [
                {
                    name: "all",
                    value: "0.0.0.0/0"
                },
            ],
        },
        backupConfiguration: {
            enabled: true,
            pointInTimeRecoveryEnabled: true,
        },
    },
});

const postgresCertificate = new gcp.sql.SslCert("postgres", {
    commonName: "postgres",
    instance: postgres.name,
});

const postgresUserPassword = new random.RandomPassword("postgres", {
    length: 16,
});

const postgresUser = new gcp.sql.User("postgres", {
    name: "postgres",
    password: postgresUserPassword.result,
    instance: postgres.name,
});

export const ca = postgres.serverCaCerts[0].apply(v => v.cert);
export const ipAddress = postgres.publicIpAddress;
export const password = postgresUser.password;
export const key = postgresCertificate.privateKey;
export const crt = postgresCertificate.cert;
