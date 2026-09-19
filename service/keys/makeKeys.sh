# Create private key
openssl genrsa -out private.pem 2048

# Create corresponding public key
openssl rsa -in private.pem -pubout -out public.pem