# rm -rf alist* #取消注释此行以更新
如果[ ! -f "alist" ];那么
curl -L https://github.com/alist-org/alist/releases/latest/download/alist-linux-musl-amd64.tar.gz -o alist.tar.gz
tar -zxvf alist.tar.gz
rm -f alist.tar.gz
fi
./alist服务器--无前缀
