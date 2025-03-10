#!/bin/bash

BE_SERVER=TRS_BACKEND
FE_SERVER=TRS_FRONTEND

# if sessions exist, send CTRL-C to kill the servers
tmux has-session -t $BE_SERVER && tmux send-keys -t $BE_SERVER C-c
tmux has-session -t $FE_SERVER && tmux send-keys -t $FE_SERVER C-c

# run both servers in two tmux session named TSR_BACKEND and TSR_FRONTEND
tmux new-session -d -s $BE_SERVER 'bash run_backend_server.sh'
tmux new-session -d -s $FE_SERVER 'bash run_frontend_server.sh'
