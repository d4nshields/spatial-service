FROM postgis/postgis:14-3.3

ENV POSTGRES_DB=geo

ENV POSTGRES_USER=
ENV POSTGRES_PASSWORD=

WORKDIR /data

COPY geo_dump.sql /data 

ENTRYPOINT ["docker-entrypoint.sh"] 

