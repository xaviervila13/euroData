FROM nginx:alpine

COPY conf/default.conf /etc/nginx/conf.d/default.conf

# Contenido estático. Si se añade un fichero nuevo (sitemap, imágenes…),
# hay que añadirlo también aquí.
COPY index.html /usr/share/nginx/html/index.html
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY assets/ /usr/share/nginx/html/assets/
COPY data/ /usr/share/nginx/html/data/

EXPOSE 80
