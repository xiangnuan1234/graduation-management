-- 创建用户表
CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  real_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'admin')),
  major TEXT,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建课题表
CREATE TABLE IF NOT EXISTS topic (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  teacher_id INTEGER NOT NULL,
  max_students INTEGER DEFAULT 1,
  status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES user(id)
);

-- 创建设计申请表
CREATE TABLE IF NOT EXISTS application (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'pass', 'reject')),
  apply_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES topic(id),
  FOREIGN KEY (student_id) REFERENCES user(id)
);

-- 创建开题报告表
CREATE TABLE IF NOT EXISTS proposal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  file_path TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'reviewing', 'pass', 'fail')),
  score INTEGER,
  comment TEXT,
  review_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES user(id)
);

-- 创建中期检查表
CREATE TABLE IF NOT EXISTS midterm (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  progress TEXT,
  problems TEXT,
  plan TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'reviewing', 'pass', 'fail')),
  score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES user(id)
);

-- 创建文档表
CREATE TABLE IF NOT EXISTS document (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  version INTEGER DEFAULT 1,
  file_path TEXT,
  file_name TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'reviewed')),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES user(id)
);

-- 创建通知表
CREATE TABLE IF NOT EXISTS notification (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_username ON user(username);
CREATE INDEX IF NOT EXISTS idx_topic_teacher_id ON topic(teacher_id);
CREATE INDEX IF NOT EXISTS idx_application_student_id ON application(student_id);
CREATE INDEX IF NOT EXISTS idx_proposal_student_id ON proposal(student_id);
CREATE INDEX IF NOT EXISTS idx_midterm_student_id ON midterm(student_id);
CREATE INDEX IF NOT EXISTS idx_document_student_id ON document(student_id);
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);
