#!/usr/bin/env python
"""
"""

import os
import re
import json
import concurrent.futures
import logging
import copy

#logging.basicConfig(level=logging.ERROR, format='%(asctime)s %(levelname)s: %(message)s', datefmt='%Y/%m/%d %I:%M:%S %p', force=True)
#logging.basicConfig(level=logging.WARNING, format='%(asctime)s %(levelname)s: %(message)s', datefmt='%Y/%m/%d %I:%M:%S %p', force=True)
#logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s', datefmt='%Y/%m/%d %I:%M:%S %p', force=True)
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s', datefmt='%Y/%m/%d %I:%M:%S %p', force=True)

class BookManager(object):
	"""
	书籍管理对象。
	可对管理的书籍进行关键字查询，书籍目录查询，书籍内容章节获取等等操作。
	"""
	QUERY_THREAD_NUM = 10
	QUERY_MAX_RESULT_NUM = 10

	def __init__(self, books_path, load = True):
		"""
		The function initializes an object and loads books from a specified path.
		
		:param books_path: The path to the directory where the books are stored
		:param load: The `load` parameter is a boolean value that determines whether or not to load the
		books from the specified `books_path`. If `load` is set to `True`, the books will be loaded to memory. If
		`load` is set to `False`, the books will not be loaded to memory, defaults to True (optional)
		"""
		self.load_books(books_path, load = load)

	def load_books(self, books_path, load = True):
		"""
		The function `load_books` loads books from a specified path, creates an index of the books, and
		optionally loads the content of the books.
		
		:param books_path: The `books_path` parameter is the path to the directory where the books are
		stored
		:param load: The `load` parameter is a boolean flag that determines whether the book content should
		be loaded or not. If `load` is set to `True`, the book content will be loaded and stored in the
		`content` field of the `books_index` list. If `load` is set to, defaults to True (optional)
		:return: The function does not explicitly return anything.
		"""
		self.books_path = books_path
		self.books_index = []

		filenames = []
		try:
			filenames = os.listdir(books_path)
		except FileNotFoundError:
			logging.error(f"load failed, please check {books_path}...")
			return

		filenames.sort()
		book_paths = [os.path.join(books_path, filename) for filename in filenames if filename.endswith(".json")]

		for book_path in book_paths:
			book = self.load_book_bypath(book_path)
			if book is not None:
				if load == True:
					self.books_index.append({'title': book["title"], 'book_path': book_path, 'content': book})
				else:
					self.books_index.append({'title': book["title"], 'book_path': book_path, 'content': None})
		logging.info(f"load suceessed, {len(self.books_index)} books from {books_path}...")

	def load_book_bypath(self, book_path):
		"""
		The function `load_book_bypath` loads a book from a given file path and returns it as a JSON
		object.
		
		:param book_path: The book_path parameter is a string that represents the path to the book file
		that you want to load. It should be the absolute or relative path to the file, including the file
		name and extension
		:return: the loaded book, which is a JSON object.
		"""
		book = None
		with open(book_path, 'r', encoding='utf-8') as file:
			book = json.load(file)
		return book
	
	def get_index_bytitle(self, book_title):
		"""
		The function `get_index_bytitle` returns the book index for a given book title, or `None` if the
		title is not found.
		
		:param book_title: The parameter `book_title` is a string that represents the title of a book
		:return: the book index that matches the given book title. If no match is found, it returns None.
		"""
		books_index = self.books_index
		for book_index in books_index:
			if book_title == book_index['title']:
				return book_index
		return None

	def load_book_bytitle(self, book_title):
		"""
		The function "load_book_bytitle" loads a book by its title and returns its content if available,
		otherwise it loads the book by its path.
		
		:param book_title: The parameter `book_title` is a string that represents the title of a book
		:return: the content of the book with the given title if it exists in the index. If the content is
		not available in the index, it will try to load the book using the book path and return the content
		if successful. If the book is not found in either the index or the book path, it will return None.
		"""
		book_index = self.get_index_bytitle(book_title)
		if book_index is not None:
			if book_index['content'] is not None:
				return book_index['content']
			else:
				return self.load_book_bypath(book_index['book_path'])
		return None
	
	def load_book_byindex(self, book_index):
		"""
		The function `load_book_byindex` loads a book either by its content or by its path.
		
		:param book_index: The parameter `book_index` is a dictionary that contains information about a
		book. It has two keys:
		:return: the content of the book if it is not None. If the content is None, it is returning the
		result of calling the `load_book_bypath` method with the book path from the `book_index` parameter.
		"""
		if book_index['content'] is not None:
			return book_index['content']
		else:
			return self.load_book_bypath(book_index['book_path'])

	def search_all(self, query_string, search_book_string=None, limit=QUERY_MAX_RESULT_NUM):
		"""
		The `search_all` function searches for a query string in book library and returns the
		results.
		
		:param query_string: The query string is the string that you want to search for in the books. It
		can be any text or keyword that you want to find in the books
		:param search_book_string: The `search_book_string` parameter is used to filter the books to be
		searched. It is a string that specifies the books to include or exclude from the search
		:param limit: The `limit` parameter is used to specify the maximum number of search results to
		return. By default, it is set to `QUERY_MAX_RESULT_NUM`, which is a constant value defined
		elsewhere in the code. You can change the value of `limit` to control the number of search results
		returned
		:return: a QueryResults object.
		"""

		def _search_byindex(book_index, query_object):
			book = self.load_book_byindex(book_index)
			logging.info(f"search in《{book['title']}》...")

			pieces = None
			pieces_count = 0
			for volume in book["volumes"]:
				_volume = None 
				for chapter in volume["chapters"]:
					_chapter = None
					if (chapter.get("paragraphs")):
						for paragraph in chapter["paragraphs"]:
							content = paragraph["content"]
							result = query_object.excute_query(content)
							if result == True:
								if pieces is None:
									pieces = {'title': book["title"], 'description': book["description"], 'volumes': []}
								if _volume is None:
									_volume = {'title': volume["title"], 'chapters': []}
									pieces['volumes'].append(_volume)
								if _chapter is None:
									_chapter = {'title': chapter["title"], 'hits': []}
									_volume['chapters'].append(_chapter)
								_chapter['hits'].append(content)
								pieces_count += 1

			logging.debug(pieces)
			return pieces, pieces_count
		
		query_object = QueryObject(query_string)
		
		# 通过search_book_string筛选出要搜索的search_books_index
		search_books_index = []
		if search_book_string is not None and len(search_book_string) > 0:
			book_title_list = search_book_string[1:].split(",")
			if search_book_string[0] == '+':
				for book_title in book_title_list:
					book_index = self.get_index_bytitle(book_title)
					if book_index is not None:
						search_books_index.append(book_index)
			elif search_book_string[0] == '-':
				for book_index in self.books_index:
					if book_title in book_title_list:
						logging.info(f"pass《{book_title}》...")
						continue
					else:
						search_books_index.append(book_index)
		else:
			search_books_index = self.books_index

		query_results = QueryResults(query_object)
		query_results.query_target_count = len(search_books_index)

    # 多线程方式
		# 使用 ThreadPoolExecutor 对每个book的搜索启动一个线程进行处理
		search_book_count = 0
		total_pieces_count = 0
		with concurrent.futures.ThreadPoolExecutor(max_workers = self.QUERY_THREAD_NUM, thread_name_prefix='s_thread') as executor:
			futures = [executor.submit(lambda p: _search_byindex(*p), (book_index, query_object)) for book_index in search_books_index]
			# 等待每个线程执行完毕
			for future in concurrent.futures.as_completed(futures):
				pieces, pieces_count = future.result()
				if pieces is not None:
					query_results.add_result_pieces([pieces]) # 非线程安全
					total_pieces_count += pieces_count
					search_book_count = search_book_count + 1 if pieces_count > 0 else search_book_count
			
		if limit is not None:
			query_results.limit(limit)
		return query_results

	def get_book_list(self, query_string):
		query_object = QueryObject(query_string)
		book_results = BookResults(query_object)
		book_results.query_target_count = len(self.books_index) if(self.books_index) else 0

		for book_index in self.books_index:
			book = self.load_book_byindex(book_index)
			if book is None:
				continue
			
			piece = None
			if query_string is not None and len(query_string):
				result = query_object.excute_query(book["title"])
				if result != True:
					for volume in book["volumes"]:
						if piece:
							break
						result = query_object.excute_query(volume["title"])
						if result != True:
							for chapter in volume["chapters"]:
								result = query_object.excute_query(chapter["title"])
								if result == True:
									piece = {'title': book["title"], 'description': book["description"], 'hit': {'type': 'book', 'content': chapter["title"]}}
									break
						else:
							piece = {'title': book["title"], 'description': book["description"], 'hit': {'type': 'book', 'content': volume["title"]}}
							break
				else:
					piece = {'title': book["title"], 'description': book["description"], 'hit': {'type': 'book', 'content': book["title"]}}
			else:
				piece = {'title': book["title"], 'description': book["description"], 'hit': {'type': 'book', 'content': book["title"]}}

			if piece is not None:
				book_results.add_result_pieces([piece])

		return book_results
	
	def get_book_catalogue(self, q):
		book_index = self.get_index_bytitle(q)
		if book_index is None:
			logging.debug(f"can't find book: {q}.")
			return None
		
		book = self.load_book_byindex(book_index)
		_book = copy.deepcopy(book)

		for v in book["volumes"]:
			for c in v["chapters"]:
				c["paragraphs"] = None

		return _book
		
	def get_book_content(self, q, v, c):
		book_index = self.get_index_bytitle(q)
		if book_index is None:
			logging.debug(f"can't find book: {q}.")
			return None
		
		book = self.load_book_byindex(book_index)
		# 只有书籍名称，返回同名书籍
		if v is None and c is None:
			return book

		# 找同名书籍的同名卷
		if v is not None and c is None:
			for volume in book["volumes"]:
				# 找同名卷
				if volume["title"] == v:
					_book = {'title': book["title"], 'description': book["description"]}
					_book["volumes"] = [volume]
					return _book
			# 找不到同名书籍中的同名卷，返回空
			logging.debug(f"can't find volume: {v}.")
			return None
		
		# 找同名书籍的同名章节
		if v is None and c is not None:
			for volume in book["volumes"]:
				for chapter in volume["chapters"]:
					if chapter["title"] == c:
						_volume = {'title': volume["title"]}
						_volume["chapters"] = [chapter]
						_book = {'title': book["title"], 'description': book["description"]}
						_book["volumes"] = [_volume]
						return _book
			logging.debug(f"can't find chapter: {c}.")								
			return None
		
		# 找同名书籍的同名卷的同名章节
		if v is not None and c is not None:
			for volume in book["volumes"]:
				if volume["title"] == v:
					for chapter in volume["chapters"]:
						if chapter["title"] == c:
							_volume = {'title': volume["title"]}
							_volume["chapters"] = [chapter]
							_book = {'title': book["title"], 'description': book["description"]}
							_book["volumes"] = [_volume]
							return _book
					else:
						logging.debug(f"can't find chapter: {c}.")								
						return None
			logging.debug(f"can't find volume: {v}.")
			return None
		return None

class QueryObject(object):
	"""
	查询对象，负责对给定的内容判断是否符合查询语句条件。
	"""
	def __init__(self, query_string=None):
		"""
		初始化QueryObject对象。

		:param query_string: 查询语句。
		"""
		if query_string is not None:
			self.query_string = query_string
			self.query_list = self.parse_query(query_string)
		else:
			self.query_string = None
			self.query_list = None

	def __parse_nestedbrackets_to_list(self, s, i = 0, level = 0):
		"""
		对带小括号的字符串解码为嵌套的list。
		比如：s = "(大人 or 小人) and not 君子", 或者s = "a and and b or c", 
		或者s = "h or (a and (b or c and not (f or g))) and (not e) or k or j and (i and m)"
		
		本函数为迭代函数，因此，每次输出都返回解码到第几个字符，下一次迭代需要解码的字符串以及嵌套层数。

		:param s: 带嵌套小括号的字符串
		:param i: 第几个字符开始解码，外部调用不用定义
		:param level: 当前为嵌套第几层，外部调用不用定义
		:return:
		  tuple: 包含三个元素的元组。
			第一个元素，下一次迭代从第几个字符开始解码；
			第二个元素，下一次迭代的字符串；
			第三个元素，下一次迭代的嵌套层数。
		
		示例:
		>>> s = "h or (a and (b or c and not (f or g))) and (not e) or k or j and (i and m)"
		>>> _parse_nestedbrackets_to_list(s)
		(74,
		['h or ',
  		['a and ', ['b or c and not ', ['f or g']]],
			' and ',
			['not e'],
			' or k or j and ',
			['i and m']],
		0)

		reference from: stackoverflow.com/questions/14952113/how-can-i-match-nested-brackets-using-regex
		"""
		result = []
		content = ''
		while i < len(s):
			if s[i] == '(':
				if len(content):
					logging.debug(f"L{level}, {content}")
					result.append(content)
					content = ''							
				i, r, level = self.__parse_nestedbrackets_to_list(s, i + 1, level + 1)
				result.append(r)
			elif s[i] == ')':
				if len(content):
					logging.debug(f"L{level}, {content}")
					result.append(content)
				return i + 1, result, level - 1
			else:
				content += s[i]
				i += 1
				logging.debug(f"L{level}, {content}")
		if len(content):
			logging.debug(f"L{level}, {content}")
			result.append(content)
			content = ''
		return i, result, level

	def __judge_condition(self, conditiona, conditionb, operator):
		"""
    输出对两个条件进行操作符指定操作后的结果。

		:param conditiona: 条件A
		:param conditiona: 条件B
		:param operator: 条件操作符号，AND, OR
		:return: 输出条件执行后的结果。
    """
		assert conditiona is not None or conditionb is not None
		if conditiona is None and conditionb is not None:
			return conditionb
		if conditionb is None and conditiona is not None:
			return conditiona
		
		#assert operator == 'AND' or operator == 'OR'
		if operator == 'AND':
			return conditiona and conditionb
		elif operator == 'OR':
			return conditiona or conditionb
		else:
			return conditiona and conditionb
			#logging.error(f"Error in A: {conditiona}, B: {conditionb}, operator: {operator}.")
	
	def __excute_single_query(self, query, content, last_condition=None, operator=None, not_operator=False, level=0):
		"""
    对给定的content，执行query查询，并和last_condition进行条件操作。

		:param query: 非嵌套的查询语句，有三种形式，如：
    	1. query type1 = condition + operator + [query type1]
    	2. query type2 = operator
    	3. query type3 = operator + condition + [query type2 | query type3]
    	其中, 
			query中的operator = AND | OR | NOT | AND + NOT | OR + NOT
    :param last_condition: 上一个查询条件结果。
		:param operator: 上一个查询条件和本次查询条件的条件操作符。
		:param not_operator: 本次条件是否是包含not前缀操作符。
		:return:
		  tuple: 包含三个元素的元组。
			第一个元素，执行条件查询后的结果；
			第二个元素，未执行完成的条件操作符；
			第三个元素，未执行完成的条件操作符是否是包含not前缀操作符。
		NOTE: 应该处理当条件已经变成FALSE后，就不应该在往下处理。
		"""
		operator = operator
		not_operator = not_operator
		last_condition = last_condition
		result = last_condition
		condition = None
		for index, word in enumerate(query):
			if len(word) == 0:
				continue
			upper_word = word.upper()
			if upper_word == 'AND' or upper_word == 'OR':
				operator = upper_word
			elif upper_word == 'NOT':
				not_operator = True
			else:
				match = [m.start() for m in re.finditer(word, content)]
				condition = True if len(match) else False

				if not_operator:
					condition = not condition
					not_operator = False
				if last_condition is not None:
					result = self.__judge_condition(last_condition, condition, operator)
					operator = None
					last_condition = result
				else:
					last_condition = condition
					condition = None
			logging.debug(f"{'': <{level*2}}{index}: {word}, A: {last_condition}, B: {condition}, operator: {operator}, not: {not_operator}.")
		return last_condition, operator, not_operator

	def __excute_query(self, querylist, content, last_condition=None, operator=None, not_operator=False, level=0):
		"""
    对给定的content，执行querylist嵌套查询，并和last_condition进行条件操作。

		:param querylist: 嵌套查询对象。
    :param last_condition: 上一个查询条件结果。
		:param operator: 上一个查询条件和本次查询条件的条件操作符。
		:param not_operator: 本次条件是否是包含not前缀操作符。
		:return:
		  tuple: 包含三个元素的元组。
			第一个元素，执行条件查询后的结果；
			第二个元素，未执行完成的条件操作符；
			第三个元素，未执行完成的条件操作符是否是包含not前缀操作符。
		NOTE: 应该处理当条件已经变成FALSE后，就不应该在往下处理。
		"""
		last_condition = last_condition
		operator = operator
		not_operator = not_operator
		level = level
		for q in querylist:
			if isinstance(q, list):
				logging.debug(f"{'': <{level*2}}L{level}, sub-query begin: {q}")
				sub_last_condition, sub_operator, sub_not_operator, _ = self.__excute_query(q, content, last_condition=None, operator=None, not_operator=False, level=level+1)

				if not_operator:
					sub_last_condition = not sub_last_condition
				not_operator = sub_not_operator
				if last_condition is not None:
					result = self.__judge_condition(last_condition, sub_last_condition, operator)
					operator = sub_operator
					last_condition = result
				else:
					last_condition = sub_last_condition
				logging.debug(f"{'': <{level*2}}L{level}, sub-query end: L: {last_condition}, operator: {operator}, not: {not_operator}.")
			else:
				result = q.split(" ")  # 以空格为分隔符分割字符串 "apple banana cherry"
				logging.debug(f"{'': <{level*2}}L{level}, query begin: " + "/".join(result)) # 输出结果为 ['apple', 'banana', 'cherry']
				last_condition, operator, not_operator = self.__excute_single_query(result, content, last_condition=last_condition, operator=operator, not_operator=not_operator, level=level)
				logging.debug(f"{'': <{level*2}}L{level}, query end: L: {last_condition}, operator: {operator}, not: {not_operator}.")
		return last_condition, operator, not_operator, level

	def get_query_keys(self, query_string=None):
		"""
		获取查询语句中的关键字。

		:param query_string: 
			查询语句字符串。
			缺省为空，默认为QueryObject对象初始化时的查询语句。
		:return:
			list，包含关键字的字符串数组。
		
		示例:
			>>> qo = QueryObject("大人 and 小人 not 君子")
			>>> qo.get_query_keys()
		['大人', '小人', '君子']
		
		原则上'君子'是不应该输出的。因为，君子在查询语句中是否定条件。
		"""
		query_string = query_string if query_string is not None else self.query_string
		if query_string is None:
			return []
		
		operators = ['and', 'AND', 'or', 'OR', 'not', 'NOT', '(', ')']
		for operator in operators:
			query_string = query_string.replace(operator, '')
		
		keys = query_string.split(' ')
		keys = [key for key in keys if len(key)]
		return keys

	def parse_query(self, query_string):
		"""
		将查询语句解码成包含嵌套关系的list。

		:param query_string: 
			查询语句字符串。
		:return:
			list，为包含非嵌套逻辑的查询语句嵌套关系的list。
		
		示例:
			>>> qo = QueryObject()
			>>> qo.parse_query("(大人 and 小人) not (君子 or 圣人)")
			[['大人 and 小人'],
				'not',
				['君子 or 圣人']
			]
		"""
		_, query_list, _ = self.__parse_nestedbrackets_to_list(query_string)
		return query_list

	def excute_query(self, content, query_list=None):
		"""
		对给定的内容，判断是否符合查询条件。

		:param content: 给定的内容字符串。
		:param query_list: 
			查询语句列表。
			缺省为空，默认为QueryObject对象初始化时的查询语句解码后的查询语句列表。

		:return:
			boolean，True符合查询条件；False，不符合查询条件。
		
		示例:
			>>> qo = QueryObject('君子 and 小人')
			>>> qo.excute_query('初六：童观，小人无咎，君子吝。')
			True	
		"""
		if query_list is not None:
			result, _, _, _ = self.__excute_query(query_list, content)
			return result
		elif self.query_list is not None:
			result, _, _, _ = self.__excute_query(self.query_list, content)
			return result
		else:
			logging.warning(f"no query string...")
			return False

from pypinyin import pinyin, Style

class QueryResults():
	
	# 在被检索到的文字之前和之后显示更多上下文
	#SURROUND = 60

	# 色谱
	COLOR_MAP = ['red', 'blue', 'green', 'yellow', 'pink']
	
	# 普通文本
	PLAIN_TEXT = 0
	# Html文本
	HTML_TEXT = 1
	# Markdown文本
	MARKDOWN_TEXT = 2
	# Mark文本
	MARK_TEXT = 3

	def __init__(self, query_object=None):
		self._query_object = query_object
		self._query_target_count = None
		self._result_pieces_count = None
		self._result_pieces = []

	def add_result_pieces(self, result_pieces):
		if result_pieces is not None:
			self._result_pieces = self._result_pieces + result_pieces
			#self._result_pieces.sort(key=lambda rp: rp['title'])
			# 按照中文拼音排序
			self._result_pieces.sort(key=lambda rp: pinyin(rp['title'], style=Style.TONE3))

	@property
	def query_object(self):
		return self._query_object

	@property
	def query_target_count(self):
		return self._query_target_count
	
	@query_target_count.setter
	def query_target_count(self, count):
		self._query_target_count = count

	def __sub(self, start=None, to=None):
		pieces = self._result_pieces
		# 参数检验和调整
		if pieces is None:
			return []
		if start is None:
			start = 0
		if to is not None and (to < start or to == start):
			return []
			
		# 提取的pieces
		result = []
		# 当前累计数
		current_count = 0
		for book in pieces:
			_book = {'title': book['title'], 'description': book["description"], 'volumes': []}
			for volume in book['volumes']:
				_volume = {'title': volume['title'], 'chapters': []}
				for chapter in volume['chapters']:
					chapter_len = len(chapter['hits'])
					end_count = current_count + chapter_len
					# 如果start超过了本章节，直接continue，避免执行后面的动作
					if start >= end_count:
						current_count += chapter_len
						continue

					start_idx = max(start - current_count, 0)
					end_idx = chapter_len
					# 如果end不为None，判断to是否在当前章节内
					if to is not None:
						end_idx = min(to - current_count, chapter_len)
					_chapter = {'title': chapter['title'], 'hits': []}
					_chapter['hits'] = chapter['hits'][start_idx:end_idx]
					_volume['chapters'].append(_chapter)

					current_count += chapter_len
					# 如果已经达到了to，直接返回
					if to is not None and current_count >= to:
						_book['volumes'].append(_volume)
						result.append(_book)
						return result

				if _volume['chapters']:
					_book['volumes'].append(_volume)

			if _book['volumes']:
				result.append(_book)
		
		return result

	def sub(self, start=None, to=None):
		"""
		提取pieces中的content从start条开始，到to条结束。
		return的结构和pieces结构一样。

		:param start: 从第start条开始，包含第start条。缺省是第0条开始。
		:param to: 从to条结束，不包含第to条。缺省是直到最后一条。
		:return:
			object, 新的QueryResults对象。
		"""
		result = self.__sub(start, to)
		if len(result) > 0:
			qo = QueryResults(self.query_object)
			qo.result_pieces_count = self.result_pieces_count
			qo.add_result_pieces(result)
			qo.query_target_count = self.query_target_count
			
			return qo
		else:
			return None

	def limit(self, limit):
		if self._result_pieces_count is None:
			self._result_pieces_count = self.__count()

		result = self.__sub(0, limit)
		self._result_pieces = result
	
	def __count(self, pieces=None):
		if pieces is None:
			pieces = self._result_pieces
		# 参数检验和调整
		if pieces is None:
			return None
	
		# 当前累计数
		current_count = 0
		for piece in pieces:
			for volume in piece['volumes']:
				for chapter in volume['chapters']:
					current_count += len(chapter['hits'])
		
		return current_count
	
	@property
	def result_pieces_count(self):
		if self._result_pieces_count is None:
			self._result_pieces_count = self.__count()
		return self._result_pieces_count

	@result_pieces_count.setter
	def result_pieces_count(self, count):
		self._result_pieces_count = count

	@property
	def result_pieces(self):
		return self._result_pieces
	
	def highlights(self, text, format=PLAIN_TEXT, keys = None, strong = False, color_map = None, surround = None):		
		if format != self.HTML_TEXT and format != self.MARKDOWN_TEXT and format != self.MARK_TEXT:
			format = self.PLAIN_TEXT	 
		if format == self.PLAIN_TEXT and surround is None :
			return text
		
		if color_map is None:
			color_map = self.COLOR_MAP
		if keys is None:
			keys = self._query_object.get_query_keys()

		pattern = '|'.join(re.escape(key) for key in keys)
		pattern = f'({pattern})'
		matches = re.finditer(pattern, text)
		
		last_match = None
		highlighted_text = ''
		for match in matches:
			keyword = match.group(0)
			index = keys.index(keyword)
			color = color_map[index % len(color_map)]

			if format == self.HTML_TEXT or format == self.MARKDOWN_TEXT:
				if strong:
					keyword = f'<span style="color: {color}; font-weight: bold;">{keyword}</span>'
				else:
					keyword = f'<span style="color: {color};">{keyword}</span>'
			elif format == self.MARK_TEXT:
					keyword = f'<mark>{keyword}</mark>'

			if last_match is None:
				start = max(0, match.start() - surround) if surround else 0
				before_text = text[start : match.start()]
				if start > 0:
					before_text = '...' + before_text
				highlighted_text = highlighted_text + before_text + keyword
			else:
				between = (match.start() - last_match.end())
				if surround is None or between < 2 * surround + 3:
					highlighted_text = highlighted_text + text[last_match.end() : match.start()] + keyword
				else:
					after_text = text[last_match.end() : last_match.end() + surround]
					after_text = after_text + '...'
					before_text = text[match.start() - surround : match.start()]
					highlighted_text = highlighted_text + after_text + before_text + keyword
			last_match = match

		end = min(len(text), last_match.end() + surround) if surround else len(text)
		after_text = text[last_match.end() : end]
		if end < len(text):
				after_text = after_text + '...'
		
		if format == self.HTML_TEXT or format == self.MARKDOWN_TEXT:
			highlighted_text = f'<p>{highlighted_text + after_text}</p>'
		else:
			highlighted_text = highlighted_text + after_text
		
		return highlighted_text
		
	def output(self, format=PLAIN_TEXT, keys = None, strong = False, color_map = None, surround = None):
		output_string = ''
		if format == self.HTML_TEXT:
			output_string += "<table border='1'>\n"
			output_string += f"<tr><th>NO</th><th>书籍</th><th>章节·段落</th><th>内容</th></tr>"
			
			index = 0
			for book in self._result_pieces:
				for volume in book['volumes']:
					for chapter in volume['chapters']:
						for hit in chapter['hits']:
							index += 1
							output_string += "<tr>"
							if len(volume['title']):
								output_string += f"<td>{index}</td><td>{book['title']}</td><td>{volume['title']}·{chapter['title']}</td>"
							else:
								output_string += f"<td>{index}</td><td>{book['title']}</td><td>{chapter['title']}</td>"
							output_string += f"<td>{self.highlights(hit, format=format, keys = keys, strong = strong, color_map = color_map, surround = surround)}</td>"
							output_string += "</tr>"
			output_string += "</table>"
		elif format == self.MARKDOWN_TEXT:
			output_string += "|NO|书籍|章节·段落|内容|\n"
			output_string += "|--|--|--|--|\n"
			
			index = 0
			for book in self._result_pieces:
				for volume in book['volumes']:
					for chapter in volume['chapters']:
						for hit in chapter['hits']:
							index += 1
							if len(volume['title']):
								output_string += f"|{index}|{book['title']}|{volume['title']}·{chapter['title']}|"
							else:
								output_string += f"|{index}|{book['title']}|{chapter['title']}|"
							output_string += f"{self.highlights(hit, format=format, keys = keys, strong = strong, color_map = color_map, surround = surround)}|\n"
		else:
			index = 0
			for book in self._result_pieces:
				for volume in book['volumes']:
					for chapter in volume['chapters']:
						for hit in chapter['hits']:
							index += 1
							if len(volume['title']):
									output_string += f"{index}. {book['title']} {volume['title']}·{chapter['title']}\n"
							else:
									output_string += f"{index}. {book['title']} {chapter['title']}\n"
							output_string += f"{self.highlights(hit, format=format, keys = keys, strong = strong, color_map = color_map, surround = surround)}\n"

		return output_string

class BookResults():

	def __init__(self, query_object=None):
		self._query_object = query_object
		self._query_target_count = None
		self._result_pieces = []

	def add_result_pieces(self, result_pieces):
		if result_pieces is not None:
			self._result_pieces = self._result_pieces + result_pieces
			#self._result_pieces.sort(key=lambda rp: rp['title'])
			self._result_pieces.sort(key=lambda rp: pinyin(rp['title'], style=Style.TONE3))

	@property
	def query_object(self):
		return self._query_object

	@property
	def query_target_count(self):
		return self._query_target_count
	
	@query_target_count.setter
	def query_target_count(self, count):
		self._query_target_count = count

	@property
	def result_pieces_count(self):
		return len(self._result_pieces)

	@property
	def result_pieces(self):
		return self._result_pieces
	
# for test
if __name__ == "__main__":
	bm = BookManager('/Users/sunyafu/zebra/BookMan/BookServer/books', False)

	#book = bm.load_book_bytitle('孙子兵法')
	#print(book)

	#book_index = bm.get_index_bytitle('孙子')
	#print(book_index)

	#book = bm.load_book_byindex(book_index)
	#print(book)

	#query_object = QueryObject()
	#text = "h or (a and (b or c and not (f or g))) and (not e) or k or j and (i and m)"
	#index, result, level = query_object._parse_nestedbrackets_to_list(text)
	#print(result)
	
	#keys = query_object.get_query_keys()
	#print(keys)

	#print(color_map.COLOR_MAP)

	# 测试 excuteQuery
	#content = "天之爱人也，薄于圣人之爱人也；其利人也，厚于圣人之利人也。大人之爱小人也，薄于小人之爱大人也；其利小人也，厚于小人之利大人也。以臧为其亲也，而爱之，非爱其亲也；以臧为其亲也，而利之，非利其亲也。以乐为爱其子，而为其子欲之，爱其子也。以乐为利其子，而为其子求之，非利其子也。"
	#content = "密云不雨，君子"
	#content = "太公曰：“臣闻君子乐得其志，小人乐得其事。今吾渔甚有似也，殆非乐之也。”"

	#query = "((大人 or 小人) and (not 君子)) or 密云不雨"
	#query = "(not 君子)"
	#query = "大人"
	#query = "not (大人 or 小人) and (君子)"
	#query = " 君子 and not (大人 or 小人)"
	#query = "大人 or 小人 or 君子 or 圣人"

	#q = QueryObject(query)

	#print(content)
	#result = q.excute_query(content)
	#print(result)

	#search_book_string = "+诗经,周礼,尚书,逸周书,左传,公羊传,谷梁传,国语,战国策,竹书纪年,穆天子传,周易,易传"
	#search_book_string = None
	#query = "布衣"
	#query = "大人 or 小人 or 君子 or 圣人" # 愚人 哲人 庶民 庶人 仕
	#query = "大人 and 小人 and 君子 and 圣人" # 愚人 哲人 庶民 庶人 仕
	#query = "大人 or 小人 or 君子 or 圣人" # 愚人 哲人 庶民 庶人 仕
	
	#query_results = bm.search_all(query, search_book_string)
	#print(f"搜索{query_results.query_target_count}本书籍，一共发现{query_results.result_pieces_count}个结果。\n")

	#query_results2 = query_results.sub(0)
	#output_string = query_results2.output(format=QueryResults.MARKDOWN_TEXT, strong=True, surround=60)

	#query_results2 = query_results.sub(9, 10)
	#output_string = query_results2.output(format=QueryResults.MARKDOWN_TEXT, strong=True, surround=60)
	#output_string = query_results.output(format=QueryResults.MARKDOWN_TEXT, strong=True, surround=60)
	#print(output_string)

	query = "隐公"
	book_results = bm.get_book_list(query)
	print(book_results.result_pieces)