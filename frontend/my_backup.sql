-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: erp_helpdesk
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `approvals`
--

DROP TABLE IF EXISTS `approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approvals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int DEFAULT NULL,
  `approver_id` int DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `remarks` text,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `approver_id` (`approver_id`),
  CONSTRAINT `approvals_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `approvals_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approvals`
--

LOCK TABLES `approvals` WRITE;
/*!40000 ALTER TABLE `approvals` DISABLE KEYS */;
INSERT INTO `approvals` VALUES (1,1,1,'Approved',NULL,'2026-06-06 07:30:24','2026-06-06 07:19:55'),(2,2,1,'Approved','Budget verified, proceeding.','2026-06-06 07:19:55','2026-06-06 07:19:55'),(3,3,1,'Rejected','Insufficient department budget for this quarter.',NULL,'2026-06-06 07:19:56'),(5,5,1,'Approved',NULL,'2026-06-06 07:45:42','2026-06-06 07:43:58');
/*!40000 ALTER TABLE `approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assets`
--

DROP TABLE IF EXISTS `assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `model` varchar(50) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `purchase_cost` decimal(10,2) DEFAULT NULL,
  `warranty_expiry` date DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `status` enum('Available','Assigned','Under Repair','Retired','Disposed') DEFAULT 'Available',
  `health_score` enum('Excellent','Warning','Critical') DEFAULT 'Excellent',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_id` (`asset_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `assets_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assets`
--

LOCK TABLES `assets` WRITE;
/*!40000 ALTER TABLE `assets` DISABLE KEYS */;
INSERT INTO `assets` VALUES (1,'AST-521612','Thinkpad 114','Laptop','03-14-15','Lenovo',NULL,NULL,NULL,NULL,NULL,NULL,'Available','Excellent','2026-06-06 05:58:41'),(2,'AST-021765','Service Company Carrrr','Car','03123-123','Hilux Suzuki Toyota',NULL,NULL,NULL,NULL,NULL,NULL,'Available','Excellent','2026-06-06 06:07:01'),(3,'AST-288495','New','Laptop','03-310123','Predator Triton 300',NULL,NULL,NULL,NULL,NULL,NULL,'Available','Excellent','2026-06-07 08:18:08');
/*!40000 ALTER TABLE `assets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `details` text,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'IT Department','2026-06-05 16:19:56'),(2,'Human Resources','2026-06-05 16:19:56'),(3,'Finance','2026-06-05 16:19:56'),(4,'General Operations','2026-06-05 16:19:56'),(5,'Procurement','2026-06-05 16:19:56'),(6,'Operations','2026-06-05 16:19:56'),(7,'Executive','2026-06-05 16:19:56'),(8,'IT Department','2026-06-05 17:22:40');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knowledge_base`
--

DROP TABLE IF EXISTS `knowledge_base`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knowledge_base` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text,
  `category` varchar(50) DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `views` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `knowledge_base_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knowledge_base`
--

LOCK TABLES `knowledge_base` WRITE;
/*!40000 ALTER TABLE `knowledge_base` DISABLE KEYS */;
INSERT INTO `knowledge_base` VALUES (1,'How to connect to the Office Printer','1. Open Settings on your laptop. 2. Go to Devices > Printers. 3. Select Add Printer. 4. Choose the \"Office-Floor-2\" printer.','Hardware',1,0,'2026-06-06 06:47:43'),(2,'ADW','AWDADAWDAWDAF','Hardware',6,0,'2026-06-06 06:56:48'),(3,'ADW','AWDADAWDAWDAF','Hardware',6,0,'2026-06-06 06:56:49'),(4,'ADW','AWDADAWDAWDAF','Hardware',6,0,'2026-06-06 06:56:50'),(5,'ADW','AWDADAWDAWDAF','Hardware',6,0,'2026-06-06 06:56:50'),(6,'ADW','AWDADAWDAWDAF','Hardware',6,0,'2026-06-06 06:56:51'),(7,'How to connect to the Office Printer','1. Open Settings on your laptop.\n2. Go to Devices > Printers.\n3. Select \"Add Printer\".\n4. Choose the \"Office-Floor-2\" printer from the list.\n5. If asked, enter the printer password: \"Printer2026\".','Hardware',1,0,'2026-06-06 07:02:44'),(8,'Installing the Corporate VPN','1. Download the VPN client from the internal portal at portal.company.com.\n2. Run the installer with administrator privileges.\n3. Enter your employee ID and password.\n4. Click \"Connect\".\n5. If you see a connection error, restart your machine.','Software',1,0,'2026-06-06 07:02:44'),(9,'Troubleshooting Wi-Fi Connection','If you cannot connect to the internet:\n1. Toggle Wi-Fi off and on in your taskbar.\n2. Forget the \"Office-Guest\" network.\n3. Re-enter the password: \"Office2026Pass\".\n4. If the issue persists, ping the gateway to check for outages.','Network',1,0,'2026-06-06 07:02:44'),(10,'Requesting New Equipment','If you need a new monitor, keyboard, or mouse, please submit a support ticket under the \"Hardware Request\" category. Your department manager must approve the request before IT can process it.','Other',1,0,'2026-06-06 07:02:45');
/*!40000 ALTER TABLE `knowledge_base` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_records`
--

DROP TABLE IF EXISTS `maintenance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` int DEFAULT NULL,
  `maintenance_type` varchar(50) DEFAULT NULL,
  `description` text,
  `scheduled_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `cost` decimal(10,2) DEFAULT NULL,
  `performed_by` int DEFAULT NULL,
  `status` enum('Scheduled','Completed','Overdue') DEFAULT 'Scheduled',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  KEY `performed_by` (`performed_by`),
  CONSTRAINT `maintenance_records_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  CONSTRAINT `maintenance_records_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_records`
--

LOCK TABLES `maintenance_records` WRITE;
/*!40000 ALTER TABLE `maintenance_records` DISABLE KEYS */;
INSERT INTO `maintenance_records` VALUES (1,1,'Hardware Cleaning','This need to be done','2026-06-06','2026-06-06',300.00,6,'Completed','2026-06-06 06:11:52'),(2,2,'Hardware Cleaning','','2026-06-03',NULL,NULL,NULL,'Scheduled','2026-06-06 07:18:32');
/*!40000 ALTER TABLE `maintenance_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `repair_history`
--

DROP TABLE IF EXISTS `repair_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repair_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` int DEFAULT NULL,
  `ticket_id` int DEFAULT NULL,
  `issue_description` text,
  `resolution` text,
  `repair_cost` decimal(10,2) DEFAULT NULL,
  `repaired_by` int DEFAULT NULL,
  `repair_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `asset_id` (`asset_id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `repaired_by` (`repaired_by`),
  CONSTRAINT `repair_history_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`),
  CONSTRAINT `repair_history_ibfk_2` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `repair_history_ibfk_3` FOREIGN KEY (`repaired_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `repair_history`
--

LOCK TABLES `repair_history` WRITE;
/*!40000 ALTER TABLE `repair_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `repair_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin','2026-06-05 16:19:56'),(2,'IT Specialist','2026-06-05 16:19:56'),(3,'Employee','2026-06-05 16:19:56'),(4,'Team Lead','2026-06-05 16:19:56'),(5,'Asset Manager','2026-06-05 16:19:56'),(6,'Department Manager','2026-06-05 16:19:56'),(7,'Executive','2026-06-05 16:19:56'),(8,'System Administrator','2026-06-05 16:19:56'),(9,'System Administrator','2026-06-05 17:22:40'),(10,'Admin','2026-06-06 05:31:22'),(11,'Employee','2026-06-06 05:31:22');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `satisfaction_ratings`
--

DROP TABLE IF EXISTS `satisfaction_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `satisfaction_ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `rating` int DEFAULT NULL,
  `feedback` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `satisfaction_ratings_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `satisfaction_ratings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `satisfaction_ratings_chk_1` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `satisfaction_ratings`
--

LOCK TABLES `satisfaction_ratings` WRITE;
/*!40000 ALTER TABLE `satisfaction_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `satisfaction_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_attachments`
--

DROP TABLE IF EXISTS `ticket_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `ticket_attachments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `ticket_attachments_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_attachments`
--

LOCK TABLES `ticket_attachments` WRITE;
/*!40000 ALTER TABLE `ticket_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_comments`
--

DROP TABLE IF EXISTS `ticket_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ticket_comments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `ticket_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_comments`
--

LOCK TABLES `ticket_comments` WRITE;
/*!40000 ALTER TABLE `ticket_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_history`
--

DROP TABLE IF EXISTS `ticket_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_id` int DEFAULT NULL,
  `changed_by` int DEFAULT NULL,
  `field_changed` varchar(50) DEFAULT NULL,
  `old_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `ticket_history_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  CONSTRAINT `ticket_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_history`
--

LOCK TABLES `ticket_history` WRITE;
/*!40000 ALTER TABLE `ticket_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `category` varchar(50) DEFAULT NULL,
  `priority` enum('Critical','High','Medium','Low') DEFAULT 'Medium',
  `status` enum('Submitted','Pending Approval','Reviewed','Assigned','In Progress','Pending User','Resolved','Closed') DEFAULT 'Submitted',
  `requester_id` int DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `sla_deadline` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `requester_id` (`requester_id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
INSERT INTO `tickets` VALUES (1,'TK-001','Printer Error',NULL,'Hardware','Critical','Reviewed',NULL,NULL,NULL,NULL,'2026-06-05 18:18:40','2026-06-06 07:30:24'),(2,'TK-002','Login Issue',NULL,'Software','High','In Progress',NULL,NULL,NULL,NULL,'2026-06-05 18:18:40','2026-06-05 18:18:40'),(3,'TK-003','Wifi Down',NULL,'Network','Critical','Submitted',NULL,NULL,NULL,NULL,'2026-06-05 18:18:40','2026-06-05 18:18:40'),(4,'TK-735599','dwa',NULL,'Hardware','Medium','Pending User',4,NULL,NULL,NULL,'2026-06-05 18:38:55','2026-06-06 07:15:42'),(5,'TKT-001','Broken Monitor','The display is flickering intermittently.',NULL,'Medium','Reviewed',1,NULL,NULL,NULL,'2026-06-06 07:43:58','2026-06-06 07:45:42'),(6,'TK-20260606-9310','Wifi Connection','I think theres an issue with the connectivity of the WIFI conection internent\n\n--- Additional Info ---\nAsset ID: IT-01234. Issue Type: Network / Internet.','IT Support','Low','Submitted',7,12,NULL,'2026-06-09 16:03:29','2026-06-06 08:03:28','2026-06-07 08:03:33'),(7,'TK-20260607-8104','need it support','test\n\n--- Additional Info ---\nAsset ID: AS0013. Issue Type: Network / Internet.','IT Support','High','Assigned',13,12,NULL,'2026-06-08 00:19:21','2026-06-07 08:19:21','2026-06-07 08:20:42');
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `role_id` (`role_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'EMP-0001','System','Admin','admin@erp.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',8,1,1,'2026-06-05 16:19:57'),(3,'EMP-ADMIN-01','System','Admin','adminp.com','$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',8,1,1,'2026-06-05 16:47:27'),(4,'EMP-001','Aljon','Reyes','admin@company.com','$2b$10$W2r1HqE6DTFQZV/WxKf7Eu5RyMiI8NwhWxPtfGCUXsdcIxxhZCXpy',1,1,1,'2026-06-05 17:23:03'),(6,'ADMIN001','System','Admin','admin@gmail.com','$2b$10$Am04lcz9kV5je7lpJXQ/J.A2omTfY7sl8AWtinFCQRL0L6ur5pVGi',1,NULL,1,'2026-06-06 05:33:16'),(7,'EMP-0002','Juan','DelaCruz','employee@erp.com','$2b$10$fvO1DXfWSGkPw.ATEpRHmuEE.poCA7fOINvXhwtDyyG6ixgQwlBJO',2,2,1,'2026-06-06 07:50:59'),(9,'EMP-2001','Tech','Support','tech@company.com','$2a$10$dummyhashedpassword',2,1,1,'2026-06-07 07:41:56'),(10,'EMP-3001','Jane','Doe','jane@company.com','$2a$10$dummyhashedpassword',3,2,1,'2026-06-07 07:41:56'),(11,'EMP-5088','First Name','Last Name','firstnamelastname@gmail.com','$2b$10$CjyYrf17o4CDB6VJQvCUlufdz8V8j/40S9iZ7BUt/Yknf5RMMqWoC',3,1,1,'2026-06-07 07:57:16'),(12,'EMP-5238','test','user','testuserspecialist@gmail.com','$2b$10$SHRQXtjf0YqCgals5FUTA.L8CuitjEFgIk16oA3Muzkvem3fp3/pq',2,1,1,'2026-06-07 08:03:17'),(13,'EMP-9411','new','new','new@gmail.com','$2b$10$HowiIjL03VBG4sgzRRM75.DG2FRPIebpDCnEtp32UpFARzoYfx6qq',3,1,1,'2026-06-07 08:16:15'),(14,'EMP-1508','ad','ad','admin@system.com','$2b$10$sZsGmj1MeH.dTX9xNHQ12ODoMhflANIc3GlYwOCwQZH4FEE6gvmYe',1,2,1,'2026-06-07 08:33:11');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-07 16:46:18
