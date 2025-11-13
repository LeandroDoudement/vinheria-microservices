FROM andyshinn/dnsmasq:latest

# Copiar configuração do dnsmasq
COPY dnsmasq.conf /etc/dnsmasq.conf

# Expor porta DNS
EXPOSE 53/udp

# Comando para iniciar o dnsmasq
CMD ["dnsmasq", "--no-daemon", "--log-queries", "--log-facility=-"]
