#!/bin/bash

python3 -m venv .venv_tsr_demo
source venv/bin/activate
pip install -r requirements.txt --no-cache-dir 
bash tsr_demo/start_server.sh