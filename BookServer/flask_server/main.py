# 导入 Flask 类, render_template 模块
from flask import  Flask, render_template

# 实例化并命名为 app 实例
app = Flask(__name__)

def func(a, b):
    return f"a: {a}, b: {b}, a+b: {a+b}."

# 增加根路由
@app.route('/')
def root():
    data = {
        'uname': 'Mark',
        'uage': 29,
        'u': {'uheight': '187cm', 'uweight': '62kg', 'love': 'coding'},
        'add_func': func
    }
    data1 = '这是外部参数导入测试2。'
    # 调用 render_template 函数，传入 html 文件参数，传入外部参数
    return render_template("index.html", **data, text = '这是一个文本的外部参数。')

# 定义 main 入口
if __name__ == "__main__":
    # 调用 run 方法，设定端口号，启动服务
    app.run(port = 5000, host = "127.0.0.1", debug = True)