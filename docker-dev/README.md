# Docker-dev 
使用 Docker 快速的建構開發環境。


## Build image 

```bash
$ cd ex-prom-client/docker-dev
$ sudo docker build prom-client . 
```

## Start development

```bash 
$ cd ex-prom-client/src
$ sudo docker run \
    -p 9300:9300 \
    -v $(pwd)/src:/usr/src/app/src \
    -d prom-test
```