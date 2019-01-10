/*
 Navicat Premium Data Transfer

 Source Server         : Localhost
 Source Server Type    : MySQL
 Source Server Version : 50711
 Source Host           : localhost
 Source Database       : api-test

 Target Server Type    : MySQL
 Target Server Version : 50711
 File Encoding         : utf-8

 Date: 10/15/2017 22:04:09 PM
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
-- ----------------------------
--  Table structure for `login`
-- ----------------------------
DROP TABLE IF EXISTS `login`;
CREATE TABLE `login` (
  `creator_id` int(11) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `person_id` int(11) NOT NULL,
  `access_level` int(11) NOT NULL DEFAULT '64',
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `reset_password` tinyint(1) NOT NULL DEFAULT '0',
  `subscription` tinyint(1) NOT NULL DEFAULT '0',
  `created` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `expired` datetime(6) NOT NULL DEFAULT '9999-12-31 23:59:59.000000',
  PRIMARY KEY (`id`,`expired`),
  UNIQUE KEY `login_email_unique_idx` (`email`,`expired`),
  UNIQUE KEY `login_person_unique_idx` (`person_id`,`expired`) USING BTREE,
  KEY `login_person_id_fk_idx` (`person_id`),
  KEY `login_creator_id_fk` (`creator_id`),
  CONSTRAINT `login_creator_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `person` (`id`),
  CONSTRAINT `login_person_id_fk` FOREIGN KEY (`person_id`) REFERENCES `person` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3796 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

-- ----------------------------
--  Records of `login`
-- ----------------------------
BEGIN;
INSERT INTO `login` VALUES ('25986', '3794', '25986', '1', 'filip.stojanac@gmail.com', 'a', '1', '0', '2017-10-15 18:56:34.408604', '2017-10-15 19:02:37.623775'), (null, '3794', '25986', '1', 'filip.stojanac@gmail.com', '$2a$10$tuOQp2Xm1KLNhXfitUmwnOalbFE9IgvnPbCR81Yyu9OcvLOBR6xoW', '0', '0', '2017-10-15 19:02:37.628172', '9999-12-31 23:59:59.000000');
COMMIT;

-- ----------------------------
--  Table structure for `person`
-- ----------------------------
DROP TABLE IF EXISTS `person`;
CREATE TABLE `person` (
  `creator_id` int(11) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `braintree_customer_id` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `created` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `expired` datetime(6) NOT NULL DEFAULT '9999-12-31 23:59:59.000000',
  PRIMARY KEY (`id`,`expired`),
  KEY `person_creator_id_fk` (`creator_id`),
  KEY `id` (`id`),
  CONSTRAINT `person_creator_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `person` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25987 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

-- ----------------------------
--  Records of `person`
-- ----------------------------
BEGIN;
INSERT INTO `person` VALUES ('25986', '25986', 'Filip', 'Stojanac', 'a', '2017-10-15 18:55:57.159845', '9999-12-31 23:59:59.000000');
COMMIT;

-- ----------------------------
--  Table structure for `role`
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `creator_id` int(11) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(255) CHARACTER SET latin1 NOT NULL,
  `description` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `created` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `role_creator_id_fk` (`creator_id`),
  CONSTRAINT `role_creator_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `person` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

-- ----------------------------
--  Records of `role`
-- ----------------------------
BEGIN;
INSERT INTO `role` VALUES (null, '1', 'Super user', null, '2016-11-04 17:45:00.000000', '2016-11-04 17:45:00.000000'), (null, '2', 'Manager', null, '2016-11-04 17:45:35.000000', '2016-11-04 17:45:35.000000'), (null, '4', 'Boss', null, '2017-01-05 10:19:58.604131', '2017-01-05 10:19:58.604131'), (null, '8', 'Lead', null, '2017-01-05 10:20:22.768140', '2017-01-05 10:20:22.768140'), (null, '16', 'Employee', null, '2017-01-05 10:20:31.997104', '2017-01-05 10:20:31.997104'), (null, '32', 'User', null, '2017-01-05 10:20:41.271744', '2017-01-05 10:20:41.271744'), (null, '64', 'Guest', null, '2017-01-05 10:20:46.907221', '2017-01-05 10:20:46.907221'), (null, '128', 'Anonymous', null, '2017-01-05 10:20:57.047565', '2017-01-05 10:20:57.047565');
COMMIT;

-- ----------------------------
--  Table structure for `session`
-- ----------------------------
DROP TABLE IF EXISTS `session`;
CREATE TABLE `session` (
  `sid` varchar(255) NOT NULL,
  `sess` text NOT NULL,
  `expired` datetime NOT NULL,
  PRIMARY KEY (`sid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
--  Records of `session`
-- ----------------------------
BEGIN;
INSERT INTO `session` VALUES ('dgC_MZCmTkoPx41BU1zFLBAdyxq9tQ1K', '{\"cookie\":{\"originalMaxAge\":86399997,\"expires\":\"2017-10-16T20:02:09.035Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":false},\"token\":\"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6IlVHVnljMjl1T2pJMU9UZzJPams1T1RrdE1USXRNekVnTWpNNk5UazZOVGt1TURBd01EQXciLCJhY2Nlc3NMZXZlbCI6MSwiaWF0IjoxNTA4MDk3NzI5LCJleHAiOjE1MDgwOTk1Mjl9.qwF0UmclRN4m9gszACM0hpUIaYkoVjNBqkD0Zvp6XIw\"}', '2017-10-16 20:02:09');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
