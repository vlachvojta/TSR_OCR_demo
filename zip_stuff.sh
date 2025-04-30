mkdir -p trash
rm -f xvlach22.zip

# git clone git@github.com:org/repo.git /full/path/to/folder
# git clone --single-branch --branch <branchname> <remote-repo>

CURRENT_DIR=$(pwd)
LIBS_DIR="$CURRENT_DIR/libs"

# arg 1: stuff to copy
# arg 2-n: stuff inside the copied folder to delete
function copy_but_then_delete() {
    SRC=$1
    cp -r $SRC libs
    DEST=$LIBS_DIR/$(basename $SRC)
    shift
    for i in "$@"; do
        rm -rf $DEST/$i
        # mv -r $DEST/$i trash
    done
}

# copy libraries to libs folder
copy_but_then_delete $DSA \
    .git \
    .gitignore \
    .idea \
    .vscode \
    docs \
    tests \
    examples \
    scripts \
    mini_stuff \
    tsr_gui \
    dataset \
    assets \
    table_detection_yolo \
    pero_ocr_word_engine/models


# copy_but_then_delete $PERO_LAYOUT_ORGANIZER \
#     .git \
#     .gitignore \
#     .vscode \
#     data

# copy_but_then_delete $PERO_OCR \
#     .git \
#     .gitignore \
#     .idea \
#     .vscode \
#     docs \
#     tests \
#     examples \
#     scripts

# remove whatever __pycache__ folders in libs
find libs -type d -name "__pycache__" -exec rm -rf {} \;
find libs -type d -name "example_data" -exec rm -rf {} \;

zip -r xvlach22.zip \
    docs.md start_tsr_demo.sh install_and_start.sh README.md \
    tsr_demo/static tsr_demo/templates tsr_demo/start.py \
    uploads/example_page libs
