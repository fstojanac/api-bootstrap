-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               5.7.24 - MySQL Community Server (GPL)
-- Server OS:                    Linux
-- HeidiSQL Version:             9.4.0.5125
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Dumping structure for table api-test.discount
CREATE TABLE IF NOT EXISTS `discount` (
  `creator_id` int(11) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(255) CHARACTER SET latin1 NOT NULL,
  `percentage` decimal(5,4) DEFAULT NULL,
  `amount` decimal(11,2) DEFAULT NULL,
  `number_of_cycles` int(11) DEFAULT NULL,
  `card_type` varchar(45) DEFAULT NULL,
  `created` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `expired` datetime NOT NULL DEFAULT '9999-12-31 23:59:59',
  PRIMARY KEY (`id`,`expired`),
  KEY `discount_creator_id_fk` (`creator_id`),
  CONSTRAINT `discount_creator_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `person` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

-- Dumping data for table api-test.discount: ~2 rows (approximately)
/*!40000 ALTER TABLE `discount` DISABLE KEYS */;
INSERT INTO `discount` (`creator_id`, `id`, `code`, `percentage`, `amount`, `number_of_cycles`, `card_type`, `created`, `expired`) VALUES
	(NULL, 129, 'all', 0.1000, NULL, NULL, NULL, '2019-01-11 02:29:41.438911', '9999-12-31 23:59:59'),
	(NULL, 130, 'mastercard', 0.4000, NULL, NULL, 'MasterCard', '2019-01-11 02:29:41.441303', '9999-12-31 23:59:59');
/*!40000 ALTER TABLE `discount` ENABLE KEYS */;

-- Dumping structure for table api-test.login
CREATE TABLE IF NOT EXISTS `login` (
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

-- Dumping data for table api-test.login: ~3 rows (approximately)
/*!40000 ALTER TABLE `login` DISABLE KEYS */;
INSERT INTO `login` (`creator_id`, `id`, `person_id`, `access_level`, `email`, `password_hash`, `reset_password`, `subscription`, `created`, `expired`) VALUES
	(25986, 3794, 25986, 1, 'filip.stojanac@gmail.com', 'a', 1, 0, '2017-10-15 18:56:34.408604', '2017-10-15 19:02:37.623775'),
	(NULL, 3794, 25986, 32, 'user@user.com', '$2a$10$db.qRSX.m57Sgu7TLU8zvOXV52nCmt4xvtJSIVmaHMtKTlt7B1Xgq', 0, 0, '2017-10-15 19:02:37.628172', '9999-12-31 23:59:59.000000'),
	(NULL, 3795, 25987, 1, 'admin@admin.com', '$2a$10$db.qRSX.m57Sgu7TLU8zvOXV52nCmt4xvtJSIVmaHMtKTlt7B1Xgq', 0, 0, '2019-01-10 18:51:27.646738', '9999-12-31 23:59:59.000000');
/*!40000 ALTER TABLE `login` ENABLE KEYS */;

-- Dumping structure for table api-test.person
CREATE TABLE IF NOT EXISTS `person` (
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
) ENGINE=InnoDB AUTO_INCREMENT=25988 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

-- Dumping data for table api-test.person: ~1 rows (approximately)
/*!40000 ALTER TABLE `person` DISABLE KEYS */;
INSERT INTO `person` (`creator_id`, `id`, `first_name`, `last_name`, `braintree_customer_id`, `created`, `expired`) VALUES
	(25986, 25986, 'Filip', 'Stojanac', '157467269', '2017-10-15 18:55:57.159845', '9999-12-31 23:59:59.000000'),
	(NULL, 25987, 'Admin', 'Admin', '157467269', '2019-01-10 18:51:27.316277', '9999-12-31 23:59:59.000000');
/*!40000 ALTER TABLE `person` ENABLE KEYS */;

-- Dumping structure for table api-test.role
CREATE TABLE IF NOT EXISTS `role` (
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

-- Dumping data for table api-test.role: ~8 rows (approximately)
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` (`creator_id`, `id`, `label`, `description`, `created`, `updated`) VALUES
	(NULL, 1, 'Super user', NULL, '2016-11-04 17:45:00.000000', '2016-11-04 17:45:00.000000'),
	(NULL, 2, 'Manager', NULL, '2016-11-04 17:45:35.000000', '2016-11-04 17:45:35.000000'),
	(NULL, 4, 'Boss', NULL, '2017-01-05 10:19:58.604131', '2017-01-05 10:19:58.604131'),
	(NULL, 8, 'Lead', NULL, '2017-01-05 10:20:22.768140', '2017-01-05 10:20:22.768140'),
	(NULL, 16, 'Employee', NULL, '2017-01-05 10:20:31.997104', '2017-01-05 10:20:31.997104'),
	(NULL, 32, 'User', NULL, '2017-01-05 10:20:41.271744', '2017-01-05 10:20:41.271744'),
	(NULL, 64, 'Guest', NULL, '2017-01-05 10:20:46.907221', '2017-01-05 10:20:46.907221'),
	(NULL, 128, 'Anonymous', NULL, '2017-01-05 10:20:57.047565', '2017-01-05 10:20:57.047565');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;

-- Dumping structure for table api-test.session
CREATE TABLE IF NOT EXISTS `session` (
  `sid` varchar(255) NOT NULL,
  `sess` text NOT NULL,
  `expired` datetime NOT NULL,
  PRIMARY KEY (`sid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table api-test.session: ~41 rows (approximately)
/*!40000 ALTER TABLE `session` DISABLE KEYS */;
INSERT INTO `session` (`sid`, `sess`, `expired`) VALUES
	('-xx7mHcUjpGbL5ggW2ZVit8Ft3GPJU1s', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:41:00.056Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTI2MCwiZXhwIjoxNTc4Njg1MjYwfQ.kizvhqrQ-hQgYwywaFWkEv8pmSvYdn9Q5QRrhAngSb8"}', '2019-01-11 19:41:00'),
	('2BK8-1712_FaYM3hfMormX0S8iYJjo8V', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:01:10.925Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6IlVHVnljMjl1T2pJMU9UZzNPams1T1RrdE1USXRNekVnTWpNNk5UazZOVGt1TURBd01EQXciLCJicmFpbnRyZWVDdXN0b21lcklkIjoiMTU3NDY3MjY5IiwiYWNjZXNzTGV2ZWwiOjMyLCJpYXQiOjE1NDcxNTA0NzAsImV4cCI6MTU0NzE1MjI3MH0.vsew76gCa8hIK8fYLwXz9P_XCxoMYcYDaq2z2Vnll_M"}', '2019-01-11 20:01:10'),
	('3aGEkUiga3qWQN0eXbXmpZeI5ftUW7nM', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:40:47.776Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTI0NywiZXhwIjoxNTc4Njg1MjQ3fQ.ZkxK2DM-5rJsbEO5KCPZhBlH9s4WWv4hs4cMD3buhk0"}', '2019-01-11 19:40:47'),
	('3epnwVabbueqv7qXJt_Hi6sxukI2lYbf', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:48:16.193Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTY5NiwiZXhwIjoxNTc4Njg1Njk2fQ.PXANtTx46whRPAAsADryZyqAp3TSdxRbZKT6Oy1KWgo"}', '2019-01-11 19:48:16'),
	('7HnhEm-TVS9JSSKGG0zqbE7s4yZMxgKk', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:05:06.428Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDcwNiwiZXhwIjoxNTc4Njg2NzA2fQ.K9rPG5CBeM3-y7jwJPuVF4bVb7TmHyHddwlwJbMc6wE"}', '2019-01-11 20:05:06'),
	('8gkZWZ1djtQcQbCoa1aD-upx3uksCdVV', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:55:13.312Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDExMywiZXhwIjoxNTc4Njg2MTEzfQ.OCsiTtSjWi1VytjLuzqIy6qYwT0Ly6zNKqyHnpgeYeY"}', '2019-01-11 19:55:13'),
	('axod_P_JLGsmhSB1DIjbvcTj9J8zqSPa', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:59:35.769Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDM3NSwiZXhwIjoxNTc4Njg2Mzc1fQ.h601Han6XZ3jmm4zuDItfAcon1qlSe_hFSm5DYrM4aw"}', '2019-01-11 19:59:35'),
	('BNrhONPhoMPt5rYvVK2BcoogRoY48hlN', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:04:37.104Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDY3NywiZXhwIjoxNTc4Njg2Njc3fQ.sTh9ObT0zODFX3dtrUTCY2q0T6eFw8M8c8vp9d0oU7Y"}', '2019-01-11 20:04:37'),
	('bP9i6mgOkZDqnAwZj7UTylX6As0pG07J', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:02:06.964Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDUyNiwiZXhwIjoxNTc4Njg2NTI2fQ.XVAGFxd0QUXaBs92NxvSC6cNbjiF-wK0j17NH6BNrAM"}', '2019-01-11 20:02:06'),
	('d68Zt4GjKHwzA4-Ck9ihhV77rS-B-d1q', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:58:58.953Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDMzOCwiZXhwIjoxNTc4Njg2MzM4fQ.obb7r2SmNTW9Ij3zBkfq6Iq2Fe-cn2A-kJpeARNQEok"}', '2019-01-11 19:58:58'),
	('dEgH01HxMI7CnKQrB5xSiZHbPqfWkkys', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:39:50.407Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTE5MCwiZXhwIjoxNTc4Njg1MTkwfQ.FwhaahffJMCBJWFNaOFNTsq8cz2WgKHnmmuyE0SK3wQ"}', '2019-01-11 19:39:50'),
	('DL4V3IHPTzCRvng4wiHZ1OzsOW49t1l8', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:05:06.401Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6IlVHVnljMjl1T2pJMU9UZzNPams1T1RrdE1USXRNekVnTWpNNk5UazZOVGt1TURBd01EQXciLCJicmFpbnRyZWVDdXN0b21lcklkIjoiMTU3NDY3MjY5IiwiYWNjZXNzTGV2ZWwiOjMyLCJpYXQiOjE1NDcxNTA3MDYsImV4cCI6MTU0NzE1MjUwNn0.BbskvaPcwdbMobkpa1828P2ZL1cYx142MZwQUSqrXxY"}', '2019-01-11 20:05:06'),
	('ElvQ6FFZdTpQaR9yPG3da8PmqbHf9bSn', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:04:49.459Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDY4OSwiZXhwIjoxNTc4Njg2Njg5fQ.GnV4ZSbwW3nRwUKRM11WvIDaLRGYs6CAK--C3PoHBPo"}', '2019-01-11 20:04:49'),
	('GuEQpA93roo1FSmh-kf7TrobZZbrgOya', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:54:55.644Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDA5NSwiZXhwIjoxNTc4Njg2MDk1fQ.DHBi9plSXkMVK3L5ghm_fReFVDg5IkEif1uRkvnJUHI"}', '2019-01-11 19:54:55'),
	('gV49mO-1mCbT7Z6RfEqINVQ0K_p9he_r', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:00:06.792Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6IlVHVnljMjl1T2pJMU9UZzNPams1T1RrdE1USXRNekVnTWpNNk5UazZOVGt1TURBd01EQXciLCJicmFpbnRyZWVDdXN0b21lcklkIjoiMTU3NDY3MjY5IiwiYWNjZXNzTGV2ZWwiOjMyLCJpYXQiOjE1NDcxNTA0MDYsImV4cCI6MTU0NzE1MjIwNn0.5v9Iw954MUj1Lo1FI6ENa8N4qpQkLFoFUh3gw-nz5Wc"}', '2019-01-11 20:00:06'),
	('hDa4pMRK5T3TYNYHy5aD5acQUIUg0frV', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:40:52.188Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTI1MiwiZXhwIjoxNTc4Njg1MjUyfQ.hFk72EA5g4k6ACUksbZh32qIX7LWKaEbLV_e_Y8OyK4"}', '2019-01-11 19:40:52'),
	('hL_j1T3f6TbgRcbUqsQPOBxC15d7qsHt', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:47:55.404Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTY3NSwiZXhwIjoxNTc4Njg1Njc1fQ.KYljvN43jhkjVlzjxaGNqnj6FaYZS8c_NPlTns-i9Ps"}', '2019-01-11 19:47:55'),
	('iyloYFhWM1U8FmPD9PlyQPMqF1Lo7909', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:42:19.526Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTMzOSwiZXhwIjoxNTc4Njg1MzM5fQ.eeuUfq1m3Ev46rR_LMpfY6mdhJ-0qN7Ho4T0qUOA2-Q"}', '2019-01-11 19:42:19'),
	('kH9BINYE07rEEl3h9cGt2-c2g5rasPyL', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:55:57.766Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDE1NywiZXhwIjoxNTc4Njg2MTU3fQ.4J8c2PjXT8bs10OLrO-3g37IwlXHnxy7va0TiVW2kUA"}', '2019-01-11 19:55:57'),
	('L9vX5HdfwzSYDADkwd2XWRqrj-ocNKxo', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:00:49.605Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDQ0OSwiZXhwIjoxNTc4Njg2NDQ5fQ.LeKm-uZoseSCX1Qt2glMxrEZi37aG1-f3vSq1YBJpgo"}', '2019-01-11 20:00:49'),
	('lADx-GxMjCT2RSbfRh4-au06ow8kt3rh', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:39:57.718Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTE5NywiZXhwIjoxNTc4Njg1MTk3fQ.lMNZbOwOczOOQrkUbgRs9ptVx2iGm85a5ydsDq4FjPE"}', '2019-01-11 19:39:57'),
	('mdKc6nxnrPURGFLxapHFWdGsYuKOKu70', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:00:06.812Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDQwNiwiZXhwIjoxNTc4Njg2NDA2fQ.Fp9shRBozl5qMdrJZqTj5SduPXKW_6IX3POXIj7dJss"}', '2019-01-11 20:00:06'),
	('MOFKmJScwc0YK4lnPd2RCrT5Y7U8XqW-', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:58:58.929Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6IlVHVnljMjl1T2pJMU9UZzNPams1T1RrdE1USXRNekVnTWpNNk5UazZOVGt1TURBd01EQXciLCJicmFpbnRyZWVDdXN0b21lcklkIjoiMTU3NDY3MjY5IiwiYWNjZXNzTGV2ZWwiOjMyLCJpYXQiOjE1NDcxNTAzMzgsImV4cCI6MTU0NzE1MjEzOH0.gWZ4xmJpInawXgK-OKsY_quBDgKadTXDudkL_O4vtX0"}', '2019-01-11 19:58:58'),
	('mwAz92bT0_nHK9YHOaCBf-TafMc0uzVY', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:56:00.926Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6IlVHVnljMjl1T2pJMU9UZzNPams1T1RrdE1USXRNekVnTWpNNk5UazZOVGt1TURBd01EQXciLCJicmFpbnRyZWVDdXN0b21lcklkIjoiMTU3NDY3MjY5IiwiYWNjZXNzTGV2ZWwiOjMyLCJpYXQiOjE1NDcxNTAxNjAsImV4cCI6MTU0NzE1MTk2MH0.ELQyygf0YuvoQlU2HDkXQMs_8EOKhmwgpLM1ZTQSLSc"}', '2019-01-11 19:56:00'),
	('OHIiD2SgMY6sroi2Ed0PnqlNIwx63mcf', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:50:18.775Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTgxOCwiZXhwIjoxNTc4Njg1ODE4fQ.vUgx5ANtDoIz5YbsqxfFoSpM04Jg3vkoMn_YAHem_2w"}', '2019-01-11 19:50:18'),
	('PC9Pzl0FFYft9UIxBf67lbVUgpYphMLD', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:53:55.537Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDAzNSwiZXhwIjoxNTc4Njg2MDM1fQ.b16Ga6iibt3m8GpPQkJrEqTqF7_oxuiJQUTc0bIbAro"}', '2019-01-11 19:53:55'),
	('PLQBMmI18VkDAd2ytTDpXFa1u9nvYKLy', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:48:16.171Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6IlVHVnljMjl1T2pJMU9UZzNPams1T1RrdE1USXRNekVnTWpNNk5UazZOVGt1TURBd01EQXciLCJicmFpbnRyZWVDdXN0b21lcklkIjoiMTU3NDY3MjY5IiwiYWNjZXNzTGV2ZWwiOjMyLCJpYXQiOjE1NDcxNDk2OTYsImV4cCI6MTU0NzE1MTQ5Nn0.w69le02_QBZ6b2NBwUiOrTdTMFw2PPUvXkBe2567Vso"}', '2019-01-11 19:48:16'),
	('rFl_uJGBEmZHQnSJW2oMl3sxIaPCeEB0', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:39:50.415Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTE5MCwiZXhwIjoxNTc4Njg1MTkwfQ.FwhaahffJMCBJWFNaOFNTsq8cz2WgKHnmmuyE0SK3wQ"}', '2019-01-11 19:39:50'),
	('Rw1-ZeaV2eA34XLeRfar6AeT5pASoDoh', '{"cookie":{"originalMaxAge":86399995,"expires":"2019-01-12T03:45:09.891Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6IlVHVnljMjl1T2pJMU9UZzJPams1T1RrdE1USXRNekVnTWpNNk5UazZOVGt1TURBd01EQXciLCJicmFpbnRyZWVDdXN0b21lcklkIjoiMTU3NDY3MjY5IiwiYWNjZXNzTGV2ZWwiOjMyLCJpYXQiOjE1NDcxNzgzMDgsImV4cCI6MTU0NzE4MDEwOH0.cmw37R6dTNwtUMLfPV6A2cqJTlIy8VeDGY6dHCAQPDc"}', '2019-01-12 03:45:09'),
	('TaNRiopVkOc2OjETlwuCYpoFEOjzwtDV', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:58:48.672Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDMyOCwiZXhwIjoxNTc4Njg2MzI4fQ.qKdeUtWvrPZUQEqL1SvkRnmr6ONLSfzTXcimoExeaWs"}', '2019-01-11 19:58:48'),
	('tNix9w-7Y5HuSJhyO60QZrblwNiKOXBu', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:56:00.964Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDE2MCwiZXhwIjoxNTc4Njg2MTYwfQ.WeNFiCSXc064ickXrjiyvDuHw3WJxNJ7ytb4yuEBtoE"}', '2019-01-11 19:56:00'),
	('U7aR0W9XcFVLMBZUpUXHRcHdjSW73GkC', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:46:27.595Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTU4NywiZXhwIjoxNTc4Njg1NTg3fQ.cZV536Cn2QCD2LaHa2C04Q5pZSUL-pPmj_I4tnCMBWo"}', '2019-01-11 19:46:27'),
	('ubVey_uNpCeEx5a-gMPv0nUzoeNsnoow', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:58:15.745Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDI5NSwiZXhwIjoxNTc4Njg2Mjk1fQ.M4i2j22WTZre5teee1bn6IuzKM8e0eWsCeEsTa-glhI"}', '2019-01-11 19:58:15'),
	('uE9lrYxaxPqoqL6nWsLkmm0wt0O8coCD', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:41:00.025Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6IlVHVnljMjl1T2pJMU9UZzNPams1T1RrdE1USXRNekVnTWpNNk5UazZOVGt1TURBd01EQXciLCJicmFpbnRyZWVDdXN0b21lcklkIjoiMTU3NDY3MjY5IiwiYWNjZXNzTGV2ZWwiOjMyLCJpYXQiOjE1NDcxNDkyNjAsImV4cCI6MTU0NzE1MTA2MH0.OJRRVqHAkQ5WBodAEzC6cbhTEKvJcm_iLtZEX009po8"}', '2019-01-11 19:41:00'),
	('X7EtHS4VM1dnHqa21Yf44vfZMYWiwFMP', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:04:58.724Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDY5OCwiZXhwIjoxNTc4Njg2Njk4fQ.UBadF3BrVYi0BKK1hExMGlQFft4eiByh7rkzim9zw2s"}', '2019-01-11 20:04:58'),
	('XEoVkhh3Elqfgi35LpXpXIC1dZ_Le3ob', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:58:53.180Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDMzMywiZXhwIjoxNTc4Njg2MzMzfQ.N-jFqWP00cMsJWEB1avReBeQds0nsluMbuvimJnI3C0"}', '2019-01-11 19:58:53'),
	('Xv_M3iRqJ69Il2E6kHPIeVa7A8v3uug6', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:39:57.723Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTE5NywiZXhwIjoxNTc4Njg1MTk3fQ.lMNZbOwOczOOQrkUbgRs9ptVx2iGm85a5ydsDq4FjPE"}', '2019-01-11 19:39:57'),
	('yWM99obi3JpIgThM2ndR3r65qwB4aA-9', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:52:27.325Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTk0NywiZXhwIjoxNTc4Njg1OTQ3fQ.UAnG1WZYwRGHyvGkZFCsNCvXnOU7CjOTpPeF0xxI24s"}', '2019-01-11 19:52:27'),
	('ZjG66EwjIOUsCTGVruI92CnO6VklQS2_', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:47:24.916Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTY0NCwiZXhwIjoxNTc4Njg1NjQ0fQ.SG5VlqG0WWCDFfMIDoVUnJ-hhC1D3GfdShqeSQjGkzY"}', '2019-01-11 19:47:24'),
	('_FVcX3yxLZ5vCdInceERLbWXC8BC0Yfe', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T20:01:10.949Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE1MDQ3MCwiZXhwIjoxNTc4Njg2NDcwfQ.4Z2C4Gf-F9oFeqEXKhsmOGvXeAZArYPCxwxEb-oTJx0"}', '2019-01-11 20:01:10'),
	('_YCWh9LYT-4ByyjTbPRvewWInHBLuQgy', '{"cookie":{"originalMaxAge":86400000,"expires":"2019-01-11T19:50:34.628Z","secure":false,"httpOnly":true,"path":"/","sameSite":false},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6bnVsbCwiYnJhaW50cmVlQ3VzdG9tZXJJZCI6bnVsbCwiYWNjZXNzTGV2ZWwiOjEyOCwiaXAiOm51bGwsImlhdCI6MTU0NzE0OTgzNCwiZXhwIjoxNTc4Njg1ODM0fQ.P6Vl3ICUnbw_dM209liP8ABdgyDtZvXrAF12O19SJ9A"}', '2019-01-11 19:50:34');
/*!40000 ALTER TABLE `session` ENABLE KEYS */;

-- Dumping structure for table api-test.subscription
CREATE TABLE IF NOT EXISTS `subscription` (
  `creator_id` int(11) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `person_id` int(11) NOT NULL,
  `braintree_subscription_id` varchar(255) NOT NULL,
  `discount_id` int(11) DEFAULT NULL,
  `created` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `expired` datetime(6) NOT NULL DEFAULT '9999-12-31 23:59:59.000000',
  PRIMARY KEY (`id`,`expired`),
  UNIQUE KEY `subscription_person_unique_idx` (`person_id`,`expired`) USING BTREE,
  KEY `subscription_person_id_fk_idx` (`person_id`),
  KEY `subscription_creator_id_fk` (`creator_id`),
  KEY `subscription_discount_id_fk_idx` (`discount_id`),
  CONSTRAINT `subscription_creator_id_fk` FOREIGN KEY (`creator_id`) REFERENCES `person` (`id`),
  CONSTRAINT `subscription_discount_id_fk` FOREIGN KEY (`discount_id`) REFERENCES `discount` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `subscription_person_id_fk` FOREIGN KEY (`person_id`) REFERENCES `person` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3799 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPACT;

-- Dumping data for table api-test.subscription: ~21 rows (approximately)
/*!40000 ALTER TABLE `subscription` DISABLE KEYS */;
INSERT INTO `subscription` (`creator_id`, `id`, `person_id`, `braintree_subscription_id`, `discount_id`, `created`, `expired`) VALUES
	(NULL, 3796, 25987, 'fjx4ww', NULL, '2019-01-10 23:07:14.480958', '2019-01-10 23:13:59.385842'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 00:41:04.742437', '2019-01-11 01:13:38.597627'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 01:13:38.633995', '2019-01-11 01:15:15.325890'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 01:15:15.351921', '2019-01-11 01:16:45.161048'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 01:16:45.184617', '2019-01-11 01:19:16.287566'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 01:19:16.331250', '2019-01-11 01:20:24.511292'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 01:20:24.522922', '2019-01-11 01:24:30.881903'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 01:24:30.943263', '2019-01-11 01:25:29.889787'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 01:25:29.943877', '2019-01-11 02:02:43.109919'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 02:02:43.159804', '2019-01-11 02:03:24.880412'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 02:03:24.898908', '2019-01-11 02:04:59.911112'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 02:04:59.934292', '2019-01-11 02:26:03.535172'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 02:26:03.552590', '2019-01-11 02:26:52.077282'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 02:26:52.108971', '2019-01-11 03:08:35.022144'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 03:08:35.040310', '2019-01-11 03:11:16.560489'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 03:11:16.583674', '2019-01-11 03:15:08.631749'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 03:15:08.696909', '2019-01-11 03:18:41.661925'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 03:18:41.685165', '2019-01-11 03:29:12.345399'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 03:29:12.370570', '2019-01-11 03:29:22.795638'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 03:29:22.832392', '2019-01-11 03:32:16.786798'),
	(NULL, 3797, 25987, 'h7hrjm', NULL, '2019-01-11 03:32:16.801701', '9999-12-31 23:59:59.000000'),
	(NULL, 3798, 25986, 'd24gsg', NULL, '2019-01-11 03:43:41.342166', '2019-01-11 03:44:16.994575'),
	(NULL, 3798, 25986, 'd24gsg', NULL, '2019-01-11 03:44:17.023677', '9999-12-31 23:59:59.000000');
/*!40000 ALTER TABLE `subscription` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
