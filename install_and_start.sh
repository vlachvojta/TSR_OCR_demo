#!/bin/bash

python3 -m venv .venv_tsr_demo
source venv/bin/activate
pip install -r requirements.txt --no-cache-dir
bash ./start_tsr_demo.sh

