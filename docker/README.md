# Docker

- [開發](./#開發)
- [正式](./#正式)

## 前置作業

```bash
$ git clone https://github.com/48763/prom-client-ex.git
$ cd prom-client-ex
```

## 建立鏡像

```bash
$ cd src/ 
$ sudo docker build -t prom-client . -f ../docker/dockerfile
```

## 啟動容器 

### 開發

```bash
$ cd ../src
$ sudo docker run --name prom-client \
    -p 9300:9300 \
    -v $(pwd)/src:/usr/src/app/src \
    -d prom-client
```

### 正式

```bash
$ cd ../src
$ sudo docker run --name prom-client \
    -p 9300:9300 \
    -d prom-client
```
