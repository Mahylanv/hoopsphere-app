#!/usr/bin/env python3
import base64
import os


def main():
    key = os.urandom(32)
    print("PDF_AES256_KEY_HEX=" + key.hex())
    print("PDF_AES256_KEY_BASE64=" + base64.b64encode(key).decode("ascii"))


if __name__ == "__main__":
    main()
