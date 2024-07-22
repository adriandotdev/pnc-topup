#Pull node latest version, current version 21 as of 11/30/2023
FROM node:21.6.2-alpine3.18

ENV PORT=4014 \
    TZ=Asia/Manila \
    NODE_ENV=stg \
    DB_HOST=192.46.227.227 \
    DB_USER=root \
    DB_PASSWORD=4332wurx \
    DB_DATABASE=parkncharge_v2 \
    DB_CONNECTION_LIMIT=20 \
    NODEMAILER_NAME=hostgator \
    NODEMAILER_HOST=mail.parkncharge.com.ph \
    NODEMAILER_PORT=465 \
    NODEMAILER_USER=no-reply@parkncharge.com.ph \
    NODEMAILER_PASSWORD=4332wurx-2023 \
    NODEMAILER_TRANSPORT=smtp \
    NODEMAILER_SECURE=true \
    JWT_ACCESS_KEY=parkncharge-4332wurx-access \
    JWT_REFRESH_KEY=parkncharge-4332wurx-refresh \
    USERNAME=sysnetparkncharge \
    PASSWORD=4332wurxparkncharge \
    WINSTON_LOGGER_MAX_SIZE=52428800 \
    WINSTON_LOGGER_MAX_FILES=5 \
    GOOGLE_GEO_API_KEY=AIzaSyB03iyW7pYkkVLBIAj_n0oVbJDGTEi38sM \
    PARKNCHARGE_SECRET_KEY=sysnetintegratorsinc:parkncharge \
    CRYPTO_ALGORITHM=aes-256-cbc \
    CRYPTO_SECRET_KEY=d6F3Efeqd6F3Efeqd6F3Efeqd6F3Efeq \
    CRYPTO_IV=3bd269bc5b740457 \
    AUTHMODULE_AUTHORIZATION=cGFya25jaGFyZ2U6cGFya25jaGFyZ2VzZXJ2aWNl \
    AUTHMODULE_GRANT_TYPE=topup \
    AUTHMODULE_URL=http://stg-parkncharge.sysnetph.com:8080/pnc-authmodule/v1/token \
    GCASH_SOURCE_URL=http://stg-parkncharge.sysnetph.com:8080/paymongo-1/payments/source/gcash \
    GCASH_PAYMENT_URL=http://stg-parkncharge.sysnetph.com:8080/paymongo-1/payments/payment/gcash \
    MAYA_PAYMENT_URL=http://stg-parkncharge.sysnetph.com:8080/paymongo-2/payments/payment/maya \
    MAYA_GET_PAYMENT_URL=http://stg-parkncharge.sysnetph.com:8080/paymongo-2/payments/getpaymentmaya

#Install PM2
RUN npm install -g pm2@latest

#Set work directory
WORKDIR /var/www/pnc

#Copy all content of the current dir to WORKDIR
COPY . .

#Install Apps
RUN npm i 

#Image port
EXPOSE 4014

#Script to start apps (specific setup of pm2)
CMD [ "pm2-runtime", "start" , "./ecosystem.config.js" ]
