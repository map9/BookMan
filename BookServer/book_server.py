# 导入 Flask 类, render_template 模块
from flask import Flask, jsonify, request
import logging
from book_manager import BookManager, QueryObject, QueryResults

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s', datefmt='%Y/%m/%d %I:%M:%S %p', force=True)

# 实例化并命名为 app 实例
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False  # 禁止中文转义

# "基于关键字搜索书库中的书中的内容，给出"访问路由
# port 6000之前能用，现在莫名其妙的不能用了，提示为：UNSAFE PORT。
# http://127.0.0.1:6060/book/search?q=大人%20and%20小人
@app.route("/book/search", methods=["GET"])
def search_book_library():
  if request.method == 'GET':
    q = request.args.get('q')
    book_list = request.args.get("book_list")
    start = request.args.get("start")
    count = request.args.get("count")
    surround = request.args.get("surround", type=int)

    logging.info(f"/book/search, q: {q}, book_list: {book_list}, start: {start}, count: {count}, surround: {surround}.")

    if start is None:
      start = 0
    
    if q and len(q) > 0:
      query_results = app.bookmanager.search_all(q, search_book_string=book_list, limit=None)
      if query_results is not None:
        to = None if count is None else count
        query_results = query_results.sub(start, to)
        for book in query_results.result_pieces:
          for volume in book['volumes']:
            for chapter in volume['chapters']:
              for index, hit in enumerate(chapter['hits']):
                hit = query_results.highlights(hit, format=QueryResults.MARK_TEXT, strong = True, surround = surround)
                chapter['hits'][index] = hit

      return jsonify({
          "query_target_count": query_results.query_target_count,
          "result_pieces_count": query_results.result_pieces_count, 
          "result_pieces": query_results.result_pieces
        })
    else:
      return jsonify(error="q parameter is missing."), 400  # 使用HTTP状态码400表示错误请求

@app.route("/book/list", methods=["GET"])
def get_book_list():
  if request.method == 'GET':
    q = request.args.get('q')

    logging.info(f"/book/list, q: {q}.")

    query_results = app.bookmanager.get_book_list(q)

    return jsonify({
      "query_target_count": query_results.query_target_count,
      "result_pieces_count": query_results.result_pieces_count, 
      "result_pieces": query_results.result_pieces
    })
  
@app.route("/book/catalogue", methods=["GET"])
def get_book_catalogue():
  if request.method == 'GET':
    q = request.args.get('q')

    logging.info(f"/book/catalogue, q: {q}.")

    book_catalogue = app.bookmanager.get_book_catalogue(q)

    if book_catalogue is not None:
      return jsonify(book_catalogue)
    else:
      return jsonify(error="can't find book catalogue."), 400  # 使用HTTP状态码400表示错误请求

@app.route("/book/chapter", methods=["GET"])
def get_book_chapter():
  if request.method == 'GET':
    q = request.args.get('q')
    vno = request.args.get('vno', type=int)
    cno = request.args.get('cno', type=int)

    logging.info(f"/book/chapter, q: {q}, vno: {vno}, cno: {cno}.")

    book_chapter = app.bookmanager.get_book_chapter(q, vno, cno)

    if book_chapter is not None:
      return jsonify(book_chapter)
    else:
      return jsonify(error="can't find book chapter."), 400  # 使用HTTP状态码400表示错误请求

@app.route("/book/content", methods=["GET"])
def get_book_content():
  if request.method == 'GET':
    q = request.args.get('q')
    v = request.args.get('v')
    c = request.args.get('c')

    logging.info(f"/book/content, q: {q}, v: {v}, c: {c}.")

    book_content = app.bookmanager.get_book_content(q, v, c)

    if book_content is not None:
      return jsonify(book_content)
    else:
      return jsonify(error="can't find book content."), 400  # 使用HTTP状态码400表示错误请求

# 定义 main 入口
if __name__ == "__main__":
    # load all books from library path
    app.bookmanager = BookManager('/Users/sunyafu/zebra/BookMan/BookServer/books', True)
    # 调用 run 方法，设定端口号，启动服务
    app.run(port = 6060, host = "0.0.0.0", debug = True)