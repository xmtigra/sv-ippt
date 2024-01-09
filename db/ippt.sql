-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Jan 09, 2024 at 10:10 AM
-- Server version: 5.7.39
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ippt`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_payments`
--

CREATE TABLE `tbl_payments` (
  `payment_id` int(11) NOT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `tbl_payments`
--

INSERT INTO `tbl_payments` (`payment_id`, `reservation_id`, `amount`, `payment_date`) VALUES
(1, 1, '190.00', '2023-11-10 11:30:37'),
(2, 2, '320.00', '2023-11-10 11:30:37'),
(3, 3, '200.00', '2023-11-10 11:30:37'),
(4, 1, '20.00', '2024-01-06 17:44:57');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservations`
--

CREATE TABLE `tbl_reservations` (
  `reservation_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `check_in_date` date DEFAULT NULL,
  `check_out_date` date DEFAULT NULL,
  `reservation_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `tbl_reservations`
--

INSERT INTO `tbl_reservations` (`reservation_id`, `user_id`, `room_id`, `check_in_date`, `check_out_date`, `reservation_date`, `total_amount`) VALUES
(1, 1, 1, '2023-11-15', '2023-11-20', '2023-11-10 11:30:37', '400.00'),
(2, 2, 3, '2023-12-01', '2023-12-05', '2023-11-10 11:30:37', '600.00'),
(3, 3, 2, '2023-11-25', '2023-11-27', '2023-11-10 11:30:37', '240.00'),
(5, 5, 5, '2024-01-05', '2024-01-06', '2024-01-06 12:09:45', '120.00'),
(6, 4, 1, '2024-01-05', '2024-01-13', '2024-01-06 12:32:04', '640.00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_reservation_services`
--

CREATE TABLE `tbl_reservation_services` (
  `id` int(11) NOT NULL,
  `reservation_id` int(11) DEFAULT NULL,
  `service_id` int(11) DEFAULT NULL,
  `hours_used` int(11) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `tbl_reservation_services`
--

INSERT INTO `tbl_reservation_services` (`id`, `reservation_id`, `service_id`, `hours_used`, `total_amount`) VALUES
(3, 1, 4, 5, '200.00'),
(4, 5, 4, 1, '40.00'),
(5, 5, 3, 3, '60.00'),
(6, 1, 1, 2, '100.00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_rooms`
--

CREATE TABLE `tbl_rooms` (
  `room_id` int(11) NOT NULL,
  `room_number` int(11) DEFAULT NULL,
  `room_type` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `tbl_rooms`
--

INSERT INTO `tbl_rooms` (`room_id`, `room_number`, `room_type`, `price`) VALUES
(1, 101, 'Standard', '80.00'),
(2, 201, 'Deluxe', '120.00'),
(3, 301, 'Suite', '150.00'),
(4, 401, 'Standard', '80.00'),
(5, 501, 'Deluxe', '120.00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_services`
--

CREATE TABLE `tbl_services` (
  `service_id` int(11) NOT NULL,
  `service_name` varchar(100) DEFAULT NULL,
  `description` text,
  `price` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `tbl_services`
--

INSERT INTO `tbl_services` (`service_id`, `service_name`, `description`, `price`) VALUES
(1, 'Spa', 'Relaxing spa treatment', '50.00'),
(2, 'Guided Tour', 'Exciting guided tour of local attractions', '30.00'),
(3, 'Gym Access', 'Access to the fitness center', '20.00'),
(4, 'Airport Shuttle', 'Transportation to and from the airport', '40.00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_staff`
--

CREATE TABLE `tbl_staff` (
  `staff_id` int(11) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(32) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `tbl_staff`
--

INSERT INTO `tbl_staff` (`staff_id`, `first_name`, `last_name`, `email`, `phone`, `password`, `role`) VALUES
(1, 'David', 'Jones', 'david.jones@example.com', '+380639999993', '5f4dcc3b5aa765d61d8327deb882cf99', 'Receptionist'),
(2, 'Sophia', 'Davis', 'sophia.davis@example.com', '+380639999991', 'fdc94bf9572d3d1dc136a73a75c05666', 'Manager');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

CREATE TABLE `tbl_users` (
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `tbl_users`
--

INSERT INTO `tbl_users` (`user_id`, `first_name`, `last_name`, `email`, `phone`) VALUES
(1, 'John', 'Doe', 'john.doe@example.com', '+380654321234'),
(2, 'Alice', 'Smith', 'alice.smith@example.com', '+380654321234'),
(3, 'Emma', 'Johnson', 'emma.johnson@example.com', '+380654321234'),
(4, 'Michael', 'Williams', 'michael.williams@example.com', '+380654321234'),
(5, 'Olivia', 'Brown', 'olivia.brown@example.com', '+380654321234');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `fk_payments_reservations` (`reservation_id`);

--
-- Indexes for table `tbl_reservations`
--
ALTER TABLE `tbl_reservations`
  ADD PRIMARY KEY (`reservation_id`),
  ADD KEY `fk_reservations_users` (`user_id`),
  ADD KEY `fk_reservations_rooms` (`room_id`);

--
-- Indexes for table `tbl_reservation_services`
--
ALTER TABLE `tbl_reservation_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_reservation_services_reservations` (`reservation_id`),
  ADD KEY `fk_reservation_services_services` (`service_id`);

--
-- Indexes for table `tbl_rooms`
--
ALTER TABLE `tbl_rooms`
  ADD PRIMARY KEY (`room_id`);

--
-- Indexes for table `tbl_services`
--
ALTER TABLE `tbl_services`
  ADD PRIMARY KEY (`service_id`);

--
-- Indexes for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_reservations`
--
ALTER TABLE `tbl_reservations`
  MODIFY `reservation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbl_reservation_services`
--
ALTER TABLE `tbl_reservation_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbl_rooms`
--
ALTER TABLE `tbl_rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_services`
--
ALTER TABLE `tbl_services`
  MODIFY `service_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  MODIFY `staff_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_users`
--
ALTER TABLE `tbl_users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  ADD CONSTRAINT `fk_payments_reservations` FOREIGN KEY (`reservation_id`) REFERENCES `tbl_reservations` (`reservation_id`);

--
-- Constraints for table `tbl_reservations`
--
ALTER TABLE `tbl_reservations`
  ADD CONSTRAINT `fk_reservations_rooms` FOREIGN KEY (`room_id`) REFERENCES `tbl_rooms` (`room_id`),
  ADD CONSTRAINT `fk_reservations_users` FOREIGN KEY (`user_id`) REFERENCES `tbl_users` (`user_id`);

--
-- Constraints for table `tbl_reservation_services`
--
ALTER TABLE `tbl_reservation_services`
  ADD CONSTRAINT `fk_reservation_services_reservations` FOREIGN KEY (`reservation_id`) REFERENCES `tbl_reservations` (`reservation_id`),
  ADD CONSTRAINT `fk_reservation_services_services` FOREIGN KEY (`service_id`) REFERENCES `tbl_services` (`service_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
