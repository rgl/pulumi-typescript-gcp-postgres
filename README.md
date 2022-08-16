# About

This creates an example GCP Cloud SQL PostgreSQL instance using pulumi.

This will:

* Create a public PostgreSQL instance.
* Configure the PostgresSQL instance to require mTLS.
* Enable automated backups.
* Set a random `postgres` account password.
* Show how to connect to the created PostgreSQL instance using `psql`.

For further managing the PostgreSQL instance, you could use:

* The [community.postgresql Ansible Collection](https://galaxy.ansible.com/community/postgresql) as in [rgl/ansible-init-postgres](https://github.com/rgl/ansible-init-postgres).

For equivalent examples see:

* pulumi google-native: https://github.com/rgl/pulumi-typescript-google-postgres
* terraform: https://github.com/rgl/terraform-gcp-cloud-sql-postgres

# Usage (Windows)

Install the `gcloud` application:

See https://cloud.google.com/sdk/docs/install

Install the dependencies:

```powershell
choco install -y pulumi --version 3.37.2
choco install -y nodejs-lts --version 16.16.0
choco install -y postgresql14 --ia '--enable-components commandlinetools'
Import-Module "$env:ChocolateyInstall\helpers\chocolateyInstaller.psm1"
Update-SessionEnvironment
npm install
```

Login into your GCP account:

```powershell
# see https://cloud.google.com/sdk/docs/authorizing
gcloud auth login --no-launch-browser
gcloud config set project PROJECT_ID # see gcloud projects list
gcloud config set compute/region REGION_ID # see gcloud compute regions list
gcloud auth application-default login --no-launch-browser
```

Verify your GCP account settings:

```powershell
gcloud config get account
gcloud config get project
gcloud config get compute/region
```

Set the environment:

```powershell
Set-Content -Encoding ascii secrets.ps1 @'
$env:PULUMI_SKIP_UPDATE_CHECK = 'true'
$env:PULUMI_BACKEND_URL = "file://$($PWD -replace '\\','/')" # NB pulumi will create the .pulumi sub-directory.
$env:PULUMI_CONFIG_PASSPHRASE = 'password'
'@
```

Provision:

```powershell
. .\secrets.ps1
pulumi login
pulumi whoami -v
pulumi config set gcp:project $(gcloud config get project)
pulumi config set gcp:region $(gcloud config get compute/region)
pulumi up
```

Connect to it:

```powershell
# see https://www.postgresql.org/docs/14/libpq-envars.html
# see https://cloud.google.com/sql/docs/postgres/connect-admin-ip?authuser=2#connect-ssl
pulumi stack output ca | Out-File -Encoding ascii pgcacerts.pem
pulumi stack output crt | Out-File -Encoding ascii postgres-crt.pem
pulumi stack output key --show-secrets | Out-File -Encoding ascii postgres-key.pem
$env:PGSSLMODE = 'verify-ca'
$env:PGSSLROOTCERT = 'pgcacerts.pem'
$env:PGSSLCERT = 'postgres-crt.pem'
$env:PGSSLKEY = 'postgres-key.pem'
$env:PGPASSWORD = pulumi stack output password --show-secrets
$env:PGHOSTADDR = pulumi stack output ipAddress --show-secrets
$env:PGDATABASE = 'postgres'
$env:PGUSER = 'postgres'
psql
```

Execute example queries:

```sql
select version();
select current_user;
select case when ssl then concat('YES (', version, ')') else 'NO' end as ssl from pg_stat_ssl where pid=pg_backend_pid();
```

Exit the `psql` session:

```sql
exit
```

Destroy everything:

```powershell
pulumi destroy
```

# Reference

* https://www.pulumi.com/registry/packages/gcp/api-docs/
