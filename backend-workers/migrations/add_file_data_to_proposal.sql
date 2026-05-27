-- 为 proposal 表添加 file_data 字段（如果不存在）
ALTER TABLE proposal ADD COLUMN file_data TEXT;
