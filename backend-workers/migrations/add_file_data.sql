-- 为 proposal 表添加 file_data 字段存储 Base64 文件内容
ALTER TABLE proposal ADD COLUMN file_data TEXT;

-- 为 document 表添加 file_data 字段存储 Base64 文件内容
ALTER TABLE document ADD COLUMN file_data TEXT;
