-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 15, 2025 at 06:32 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nodejsdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `image` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `image`, `created_at`, `updated_at`) VALUES
(10, '1756819825983-822041048.jpg', '2025-08-26 18:33:27', '2025-08-26 18:33:27'),
(11, '1756233227859-689577192.jpg', '2025-08-26 18:33:34', '2025-09-02 13:32:48'),
(12, '1756233214858-642353593.jpg', '2025-08-27 18:33:34', '2025-09-02 13:32:50'),
(15, '1756233207226-828531685.jpg', '2025-08-27 18:33:27', '2025-09-02 13:32:44');

-- --------------------------------------------------------

--
-- Table structure for table `blogs`
--

CREATE TABLE `blogs` (
  `id` int(11) NOT NULL,
  `img` varchar(255) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `writer` varchar(255) NOT NULL,
  `short_description` text DEFAULT NULL,
  `yt_link` varchar(255) DEFAULT NULL,
  `type` enum('video','img') NOT NULL DEFAULT 'img',
  `full_description` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blogs`
--

INSERT INTO `blogs` (`id`, `img`, `title`, `slug`, `writer`, `short_description`, `yt_link`, `type`, `full_description`, `created_at`, `updated_at`) VALUES
(12, NULL, 'Titles', 'titles', 'sdf s;df', 'sdf sdf ldf lsf', 'https://www.youtube.com/watch?v=xGaZBfJOyAc', 'video', 'sdfsdfsdfdf', '2025-09-11 00:24:36', '2025-09-11 00:53:24'),
(14, '1757552953448-738757116.jpg', 'sadfasd', 'sadfasd', 'asdas', 'sadfwefger', NULL, 'img', 'sdfsdfwe', '2025-09-11 01:09:13', '2025-09-11 01:09:13');

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `carts`
--

INSERT INTO `carts` (`id`, `user_id`, `product_id`, `quantity`, `price`, `created_at`, `updated_at`) VALUES
(42, 6, 1, 1, 45.00, '2025-09-15 06:55:40', '2025-09-15 06:55:40'),
(43, 6, 2, 1, 32.00, '2025-09-15 07:03:09', '2025-09-15 07:03:09');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `image`, `created_at`, `updated_at`) VALUES
(12, 'milk', '1756106271615-893687521.jpg', '2025-08-25 07:17:51', '2025-08-25 07:17:51'),
(13, 'ghee', '1756106303062-563785591.jpg', '2025-08-25 07:18:23', '2025-08-25 07:18:23'),
(14, 'panner', '1756106331195-954896391.jpg', '2025-08-25 07:18:51', '2025-08-25 07:18:51'),
(15, 'lassi', '1756106379424-844208090.jpg', '2025-08-25 07:19:39', '2025-08-25 07:19:39'),
(16, 'butter', '1756106398029-775190582.jpg', '2025-08-25 07:19:58', '2025-08-25 07:19:58'),
(17, 'dahi', '1756106418665-185765766.jpg', '2025-08-25 07:20:18', '2025-08-25 07:20:18'),
(18, 'honey', '1756106440175-701522988.jpg', '2025-08-25 07:20:40', '2025-08-25 07:20:40');

-- --------------------------------------------------------

--
-- Table structure for table `newaddresses`
--

CREATE TABLE `newaddresses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `site_user_id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `street` varchar(255) NOT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `zip_code` varchar(20) NOT NULL,
  `country` varchar(100) NOT NULL,
  `address_type` enum('home','work','other') DEFAULT 'home',
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `newaddresses`
--

INSERT INTO `newaddresses` (`id`, `site_user_id`, `first_name`, `last_name`, `gender`, `email`, `phone`, `street`, `landmark`, `city`, `state`, `zip_code`, `country`, `address_type`, `is_default`, `latitude`, `longitude`, `created_at`, `updated_at`) VALUES
(1, 6, 'ravi', 'ponn', 'male', 'admin@example.com', '9876543210', 'booth no 7, pocket c, Wave Estate,sector 85', 'al', 'Mohali', 'Punjab', '140306', 'India', 'home', 1, NULL, NULL, '2025-09-09 04:31:57', '2025-09-11 00:28:54'),
(2, 6, 'vikas', 'gupta', 'female', 'jontypundir12@gmail.com', '9876543210', 'booth no 7, pocket c, Wave Estate,sector 85', 'al', 'Mohali', 'Punjab', '140306', 'India', 'home', 0, NULL, NULL, '2025-09-09 04:33:29', '2025-09-11 00:28:54');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `site_user_id` bigint(20) UNSIGNED NOT NULL,
  `address_id` bigint(20) UNSIGNED DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','processing','completed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
  `type` enum('onetime','daily','alternative') NOT NULL DEFAULT 'onetime',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `site_user_id`, `address_id`, `total_amount`, `status`, `payment_status`, `type`, `created_at`, `updated_at`) VALUES
(1, 6, 2, 960.00, 'processing', 'paid', 'daily', '2025-09-09 06:20:35', '2025-09-09 06:20:35'),
(2, 6, 1, 960.00, 'processing', 'paid', 'daily', '2025-09-11 00:27:39', '2025-09-11 00:27:39'),
(3, 6, 1, 480.00, 'processing', 'paid', 'alternative', '2025-09-11 00:29:29', '2025-09-11 00:29:29'),
(4, 6, 1, 4500.00, 'processing', 'paid', '', '2025-09-11 00:31:42', '2025-09-11 00:31:42'),
(5, 6, 1, 4500.00, 'processing', 'paid', '', '2025-09-11 01:52:43', '2025-09-11 01:52:43');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,2) NOT NULL,
  `start_date` date DEFAULT NULL,
  `last_delivery_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `quantity`, `price`, `start_date`, `last_delivery_date`, `created_at`, `updated_at`) VALUES
(1, 1, 2, 1, 32.00, '2025-09-09', NULL, '2025-09-09 06:20:35', '2025-09-09 06:20:35'),
(2, 2, 2, 1, 32.00, '2025-09-11', NULL, '2025-09-11 00:27:39', '2025-09-11 00:27:39'),
(3, 3, 2, 1, 32.00, '2025-09-11', NULL, '2025-09-11 00:29:29', '2025-09-11 00:29:29'),
(4, 4, 4, 3, 1500.00, '2025-09-11', NULL, '2025-09-11 00:31:42', '2025-09-11 00:31:42'),
(5, 5, 4, 3, 1500.00, '2025-09-11', NULL, '2025-09-11 01:52:43', '2025-09-11 01:52:43');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(8,2) NOT NULL,
  `old_price` decimal(8,2) DEFAULT NULL,
  `stock` int(11) NOT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `one_time` tinyint(1) NOT NULL DEFAULT 0,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Stores product details like weight, size, etc.',
  `unit_quantity` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `description2` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `old_price`, `stock`, `images`, `one_time`, `details`, `unit_quantity`, `created_at`, `updated_at`, `description2`) VALUES
(1, 12, 'A2 Desi Milk', 'a2-desi-milk', '<h2>A2 Gir Cow Milk — Pure, Nutritious & Delicious</h2>\r\n\r\n  <p>\r\n    <strong>Our A2 Gir Cow Milk</strong> is a wholesome blend of good health and well-being.\r\n    Naturally sweet and aromatic, it delivers an unforgettable taste that both kids and adults love.\r\n  </p>\r\n\r\n  <p>\r\n    Rich in essential nutrients like <strong>calcium</strong>, <strong>potassium</strong>,\r\n    <strong>protein</strong>, <strong>Omega-3</strong> and <strong>Omega-6</strong>,\r\n    it supports strong bones, overall fitness, and helps maintain healthy cholesterol levels.\r\n    The presence of <strong>strontium</strong> supports immunity and helps protect the body from harmful radiations.\r\n  </p>\r\n\r\n  <p>\r\n    For growing children, this milk nourishes the mind and encourages sharper thinking and creativity—fuel for an\r\n    innovative brain.\r\n  </p>\r\n\r\n  <h3>Why Choose Our A2 Gir Cow Milk?</h3>\r\n  <ul>\r\n    <li>Naturally sweet fragrance and yummy taste</li>\r\n    <li>Complete nutrition for everyday wellness</li>\r\n    <li>Supports healthy cholesterol balance</li>\r\n    <li>Immunity support with strontium</li>\r\n    <li>Perfect for kids’ growth and cognitive development</li>\r\n  </ul>\r\n\r\n  <p>\r\n    Boil your A2 Gir Cow Milk and you’ll see a natural, untouched layer of <em>malai</em>—a simple proof of its purity,\r\n    richness, and farm-fresh quality.\r\n  </p>\r\n\r\n  <p><strong>Choose A2 Gir organic milk</strong> for a healthier today and a happier tomorrow.</p>', 45.00, 50.00, 0, '[\"1756112633698-744259699.jpg\",\"1756112633722-76535705.jpg\",\"1756112633743-360432380.jpg\",\"1756112633766-902712305.jpg\",\"1756112633854-113100488.jpg\"]', 0, NULL, '500ml', '2025-08-25 09:03:53', '2025-08-29 12:42:37', '<section>\n  <h2>Discover the Wholesomeness of A2 Buffalo Milk</h2>\n  <p>\n    A2 Buffalo milk is known for its <strong>higher fat content (6–7%)</strong>,\n    creamy texture, rich taste, and superior nutrition. Naturally sourced from\n    Indian buffalo breeds, it differs from cow’s milk in flavor and composition.\n  </p>\n  <p>\n    Consumed in countries like <em>India, Italy, Nepal, and Egypt</em>, it is a\n    <strong>protein-rich food</strong> that helps you feel fuller for longer and\n    may support bone health.\n  </p>\n  <p>\n    Its thickness and creaminess make it ideal for preparing <strong>ghee,\n    butter, paneer, and cheese</strong>.\n  </p>\n</section>\n'),
(2, 12, 'Standard Milk', 'standard-milk', '<h2>Standard Cow Milk — Fresh, Nutritious & Wholesome</h2>\r\n\r\n  <p>\r\n    <strong>Our Standard Cow Milk</strong> is a natural source of energy and nourishment,\r\n    making it a perfect choice for your daily health needs. With its creamy taste and smooth texture,\r\n    it’s loved by kids and adults alike.\r\n  </p>\r\n\r\n  <p>\r\n    Packed with essential nutrients like <strong>calcium</strong>, <strong>protein</strong>, \r\n    <strong>vitamins</strong>, and <strong>minerals</strong>, it supports strong bones, \r\n    healthy muscles, and overall well-being. A daily glass of this milk keeps you active, \r\n    refreshed, and energized throughout the day.\r\n  </p>\r\n\r\n  <h3>Why Choose Our Standard Cow Milk?</h3>\r\n  <ul>\r\n    <li>Fresh, farm-direct quality</li>\r\n    <li>Rich in calcium for strong bones & teeth</li>\r\n    <li>Excellent source of natural protein</li>\r\n    <li>Perfect for tea, coffee, desserts, and daily drinking</li>\r\n    <li>Loved by the whole family</li>\r\n  </ul>\r\n\r\n  <p>\r\n    Boil the milk to enjoy its natural layer of <em>malai</em>, a true sign of purity and richness.\r\n  </p>\r\n\r\n  <p><strong>Choose Standard Cow Milk</strong> for freshness, taste, and everyday nutrition.</p>', 32.00, 36.00, 0, '[\"1756112758487-78918926.jpg\",\"1756112758510-616492579.jpg\",\"1756112758543-12029355.jpg\",\"1756112758579-448635211.jpg\",\"1756112758594-343824048.jpg\"]', 0, NULL, '500ml', '2025-08-25 09:05:58', '2025-08-29 14:10:38', '<p>\n  Our Standard Milk is a powerhouse of nutrients, sourced from high-quality dairy breeds. \n  It is a perfect blend of essential vitamins and minerals needed for a healthy lifestyle. \n  One glass of Standard Milk can provide energy and nourishment equivalent to two regular meals.\n</p>\n'),
(3, 13, 'bilona ghee', 'bilona-ghee', '<h2>Bilona Ghee — The Essence of Purity & Wellness</h2>\r\n\r\n  <p>\r\n    <strong>Our Bilona Ghee</strong> is prepared using the ancient <em>Vedic Bilona method</em>, \r\n    where curd made from A2 cow milk is hand-churned and slowly simmered to produce golden, aromatic ghee. \r\n    This traditional process preserves its natural nutrients and rich flavor.\r\n  </p>\r\n\r\n  <p>\r\n    Packed with <strong>Omega-3 & Omega-9 fatty acids</strong>, <strong>vitamins A, D, E, K</strong>, \r\n    and essential minerals, Bilona Ghee supports strong bones, healthy digestion, improved immunity, \r\n    and sharper memory. Its natural aroma and grainy texture are proof of purity and authenticity.\r\n  </p>\r\n\r\n  <h3>Benefits of Bilona Ghee</h3>\r\n  <ul>\r\n    <li>Boosts immunity and strengthens overall health</li>\r\n    <li>Improves digestion and gut health</li>\r\n    <li>Supports brain development and memory power</li>\r\n    <li>Enhances energy and stamina</li>\r\n    <li>Promotes healthy skin and glowing complexion</li>\r\n  </ul>\r\n\r\n  <p>\r\n    Whether added to your meals, sweets, or simply a spoonful daily, Bilona Ghee is the \r\n    <strong>perfect superfood for every age group</strong>.\r\n  </p>\r\n\r\n  <p><strong>Choose Bilona Ghee</strong> for purity, tradition, and holistic well-being.</p>', 2500.00, 3000.00, 1, '[\"1756112844374-887152766.jpg\",\"1756112844431-561285163.jpg\",\"1756112844456-838449565.jpg\",\"1756112844482-748550642.jpg\",\"1756112844519-619752642.jpg\",\"1756112844550-214241635.jpg\"]', 1, NULL, '1KG', '2025-08-25 09:07:24', '2025-08-31 21:06:29', '<p>\n  Order our <strong>Pure Desi Ghee</strong> online and experience its unmatched richness and benefits. \n  Crafted from the finest quality cow’s milk, this ghee is traditionally prepared to preserve its authentic aroma, flavor, and nutrition. \n  From enhancing the taste of <em>khichdi</em>, <em>Gajar ka Halwa</em>, or <em>Paneer Lababdar</em> to being a trusted ingredient in Ayurvedic practices, \n  its versatility is unmatched. This 100% natural ghee is free from preservatives, packed with healthy fats and essential vitamins, making it \n  the perfect companion for both your kitchen and wellness routine.\n</p>\n'),
(4, 13, 'A2 Ghee', 'a2-ghee', '\n  <h2 id=\"ghee-title\">A2 Desi Cow Ghee – Pure, Traditional, Nourishing</h2>\n\n  <p>\n    The A2 cow ghee is prepared traditionally with the <strong>Bilona</strong> technique and comes from milk sourced from ethically raised local Indian cows. The ghee from A2 milk is prepared through slow churning and gentle simmering, transforming it into a nutritious, wholesome golden ghee that’s as flavorful as it is pure.\n  </p>\n\n  <p>\n    This A2 milk ghee is essential in cooking to support good health. It helps with digestion and the immune system, bringing benefits to traditional homemade meals.\n  </p>\n\n  <h3>Why Choose Our A2 Milk Ghee?</h3>\n  <ul>\n    <li>\n      <strong>Only A2 desi cow milk:</strong> Produced exclusively from natural A2 milk from indigenous Indian cows.\n    </li>\n    <li>\n      <strong>Grass-fed & healthy:</strong> Sourced from cows that graze naturally and are cared for ethically.\n    </li>\n    <li>\n      <strong>Traditional Bilona method:</strong> Slow churning preserves nutrients and enhances taste.\n    </li>\n    <li>\n      <strong>No chemicals or preservatives:</strong> Made from scratch without additives—just pure ghee.\n    </li>\n    <li>\n      <strong>Perfect for kitchen & rituals:</strong> Elevates everyday cooking and supports wellness practices.\n    </li>\n    <li>\n      <strong>Authentic, homemade taste:</strong> Crafted the way your grandmother used to make.\n    </li>\n  </ul>\n\n  <h3>A Spoonful of Wellness, Every Day</h3>\n  <p>\n    Every batch of A2 desi cow ghee we produce is made to keep it as pure and nutritious as possible. Cooking with Gaualla’s pure desi cow ghee can support joint function, boost metabolism, and enhance flavor. If you’re seeking high-quality, fresh cow ghee to bring traditional dairy into your diet, this is the ghee your kitchen deserves.\n  </p>\n\n  <p><em>Taste the tradition. Feel the purity. Every spoon is a step toward better health.</em></p>\n\n', 1500.00, 1800.00, 1, '[\"1756112921583-997496049.jpg\",\"1756112921642-572853727.jpg\",\"1756112921684-179414421.jpg\",\"1756112921719-688025005.jpg\",\"1756112921761-282009344.jpg\",\"1756112921785-940294031.jpg\"]', 1, NULL, '1KG', '2025-08-25 09:08:41', '2025-08-31 21:07:06', '<section>\n  <h2>Gaualla A2 Ghee</h2>\n  <p>\n    <strong>Gaualla A2 Ghee</strong> is nature’s perfect gift, crafted with care and authenticity. \n    Specially made on customer demand, this ghee comes with complete breed details on request. \n    We share information such as the cow’s family history, breed name, and diet, ensuring full transparency about the source of milk used.\n  </p>\n  <p>\n    The <em>fine aroma</em>, <em>granular texture</em>, and <em>superfine colour</em> make our A2 ghee an irreplaceable choice \n    for health-conscious households. Packed and sealed in an eco-friendly container, it retains purity and freshness in every spoonful.\n  </p>\n</section>\n'),
(5, 14, 'A2 Pure  Panner', 'a2-pure-panner', '<h2>Fresh Paneer — Soft, Nutritious & Delicious</h2>\r\n\r\n  <p>\r\n    <strong>Our farm-fresh Paneer</strong> (Indian Cottage Cheese) is made from pure cow’s milk \r\n    using traditional methods to bring you the perfect balance of taste and nutrition. \r\n    Soft, creamy, and rich in protein, it’s an essential ingredient for healthy and tasty meals.\r\n  </p>\r\n\r\n  <p>\r\n    Paneer is packed with <strong>protein</strong>, <strong>calcium</strong>, \r\n    <strong>healthy fats</strong>, and vital <strong>minerals</strong> that support strong bones, \r\n    muscle growth, and overall well-being. Its high nutritional value makes it a favorite \r\n    for kids, fitness enthusiasts, and families alike.\r\n  </p>\r\n\r\n  <h3>Why Choose Our Paneer?</h3>\r\n  <ul>\r\n    <li>Made from pure, farm-fresh cow’s milk</li>\r\n    <li>Rich source of natural protein & calcium</li>\r\n    <li>Soft, creamy, and easy to digest</li>\r\n    <li>Perfect for curries, snacks, and salads</li>\r\n    <li>Boosts strength, immunity & energy levels</li>\r\n  </ul>\r\n\r\n  <p>\r\n    Whether it’s a <em>paneer butter masala</em>, <em>grilled paneer tikka</em>, or a \r\n    refreshing <em>paneer salad</em>, our paneer brings authentic taste and \r\n    wholesome nutrition to every dish.\r\n  </p>\r\n\r\n  <p><strong>Choose Fresh Paneer</strong> — a healthy delight for every meal.</p>', 120.00, 150.00, 1, '[\"1756112982429-3839817.jpg\",\"1756112982508-485683983.jpg\",\"1756112982536-588581909.jpg\",\"1756112982585-578787505.jpg\",\"1756112982606-202268385.jpg\"]', 0, NULL, '250g', '2025-08-25 09:09:42', '2025-08-29 14:14:42', '<p><strong>Gaualla Fresh Paneer</strong> – Soft, creamy, and packed with protein, crafted from pure A2 milk.</p>\n\n<p><strong>Gaualla Premium Paneer</strong> – A wholesome source of nutrition with authentic taste and farm-fresh purity.</p>\n\n<p><strong>Gaualla A2 Paneer</strong> – Rich in protein and calcium, perfect for curries, snacks, and healthy meals.</p>\n\n<p><strong>Gaualla Natural Paneer</strong> – Pure, preservative-free, and made from the goodness of A2 milk.</p>\n\n<p><strong>Gaualla Desi Paneer</strong> – Soft texture, authentic flavor, and nutrition in every bite.</p>\n'),
(6, 15, 'A2 Butter whey Desi Bilona Lassi', 'a2-butter-whey-desi-bilona-lassi', '<h2>A2 Butter Whey Desi Bilona Lassi — Refreshing & Nutritious</h2>\r\n\r\n  <p>\r\n    <strong>Our A2 Butter Whey Desi Bilona Lassi</strong> is prepared using the age-old \r\n    <em>Bilona method</em>, where fresh A2 cow curd is hand-churned to separate butter and whey. \r\n    The resulting lassi is light, refreshing, and naturally nutritious — a true gift of tradition \r\n    and purity.\r\n  </p>\r\n\r\n  <p>\r\n    Rich in <strong>probiotics</strong>, <strong>calcium</strong>, <strong>protein</strong>, \r\n    and essential <strong>vitamins</strong>, this lassi not only cools your body but also \r\n    strengthens digestion, boosts immunity, and keeps you refreshed throughout the day.  \r\n  </p>\r\n\r\n  <h3>Health Benefits</h3>\r\n  <ul>\r\n    <li>Improves digestion and gut health with natural probiotics</li>\r\n    <li>Rich in calcium for strong bones and teeth</li>\r\n    <li>Boosts immunity and overall wellness</li>\r\n    <li>Keeps the body cool, refreshed, and energized</li>\r\n    <li>100% natural, preservative-free & traditionally prepared</li>\r\n  </ul>\r\n\r\n  <p>\r\n    Enjoy it chilled on a sunny day, pair it with your meals, or sip it as a \r\n    healthy refreshment — our <strong>A2 Bilona Lassi</strong> is a perfect blend \r\n    of health, taste, and tradition.\r\n  </p>\r\n\r\n  <p><strong>Choose A2 Desi Bilona Lassi</strong> for a refreshing drink that nourishes your body and soul.</p>', 50.00, 60.00, 1, '[\"1756113072922-770906852.jpg\",\"1756113072931-746292745.jpg\",\"1756113072973-309576775.jpg\",\"1756113073001-888394722.jpg\",\"1756113073033-367942565.jpg\",\"1756113073047-473745199.jpg\"]', 0, NULL, '1Leter', '2025-08-25 09:11:13', '2025-08-29 14:15:15', '<p><strong>Gaualla A2 Butter Whey Desi Bilona Lassi</strong> – Refreshing, probiotic-rich, and made from the traditional bilona method.</p>\n\n<p><strong>Gaualla Desi Bilona Lassi</strong> – A2 butter whey based, creamy, cooling, and packed with natural probiotics.</p>\n\n<p><strong>Gaualla A2 Bilona Lassi</strong> – Wholesome, preservative-free, and crafted for digestion, energy, and taste.</p>\n\n<p><strong>Gaualla Traditional Bilona Lassi</strong> – Handcrafted from A2 butter whey, offering authentic taste and natural goodness.</p>\n\n<p><strong>Gaualla A2 Whey Lassi</strong> – A cooling, nutritious drink made with heritage methods for purity and health.</p>\n'),
(8, 18, 'Raw Natural Honey', 'raw-natural-honey', '<h2>Raw Natural Honey — Nature’s Pure Sweetness</h2>\r\n\r\n  <p>\r\n    <strong>Our Raw Natural Honey</strong> is collected directly from the beehives and delivered \r\n    to you in its most pure, unprocessed, and unheated form. It retains all the natural \r\n    <strong>enzymes</strong>, <strong>antioxidants</strong>, <strong>vitamins</strong>, and \r\n    <strong>minerals</strong> that make honey a true superfood.\r\n  </p>\r\n\r\n  <p>\r\n    Unlike processed honey, Raw Honey preserves its natural aroma, rich texture, and authentic taste. \r\n    Every spoonful boosts your immunity, supports digestion, and provides instant energy — the way \r\n    nature intended.\r\n  </p>\r\n\r\n  <h3>Health Benefits of Raw Natural Honey</h3>\r\n  <ul>\r\n    <li>Rich in antioxidants that promote overall wellness</li>\r\n    <li>Boosts immunity and protects against infections</li>\r\n    <li>Supports digestion and gut health</li>\r\n    <li>Natural energy booster for daily activities</li>\r\n    <li>Helps soothe throat irritation and cough</li>\r\n  </ul>\r\n\r\n  <p>\r\n    Use it as a natural sweetener in tea, milk, or desserts, or take a spoonful every morning \r\n    for holistic health. Our <strong>Raw Natural Honey</strong> is \r\n    <em>100% pure, chemical-free, and farm-direct</em>.\r\n  </p>\r\n\r\n  <p><strong>Choose Raw Natural Honey</strong> — a golden drop of health straight from nature.</p>', 800.00, 1000.00, 0, '[\"1756113255132-535634360.jpg\",\"1756113255157-658357781.jpg\",\"1756113255194-311604670.jpg\",\"1756113255224-834186101.jpg\",\"1756113255252-954855255.jpg\",\"1756113255277-424385464.jpg\"]', 1, NULL, '1kg', '2025-08-25 09:14:15', '2025-08-29 14:15:31', '<p><strong>Gaualla Raw Natural Honey</strong> – 100% pure, unprocessed, and packed with natural antioxidants and nutrients.</p>\n\n<p><strong>Gaualla Natural Honey</strong> – Harvested from wild floral sources, rich in taste, health, and immunity-boosting properties.</p>\n\n<p><strong>Gaualla Raw Honey</strong> – Unfiltered, chemical-free, and brimming with enzymes, vitamins, and natural sweetness.</p>\n\n<p><strong>Gaualla Pure Honey</strong> – A golden superfood straight from the hive, perfect for wellness, energy, and immunity.</p>\n\n<p><strong>Gaualla Organic Raw Honey</strong> – Nature’s liquid gold, free from additives and rich in authentic flavor.</p>\n'),
(9, 17, 'A2 Dahi', 'a2-dahi', '<h2>A2 Dahi — Pure, Creamy & Probiotic-Rich</h2>\r\n\r\n  <p>\r\n    <strong>Our A2 Dahi</strong> is prepared from 100% farm-fresh A2 cow milk using the \r\n    traditional fermentation process. Naturally thick, creamy, and delicious, it’s a wholesome \r\n    addition to your daily meals.\r\n  </p>\r\n\r\n  <p>\r\n    Packed with <strong>calcium</strong>, <strong>protein</strong>, and \r\n    <strong>probiotics</strong>, A2 Dahi strengthens bones, improves digestion, \r\n    and boosts immunity. Its natural taste and smooth texture make it loved by \r\n    both kids and adults.\r\n  </p>\r\n\r\n  <h3>Health Benefits of A2 Dahi</h3>\r\n  <ul>\r\n    <li>Improves digestion and gut health with natural probiotics</li>\r\n    <li>Strengthens bones and teeth with calcium</li>\r\n    <li>Rich in protein for energy and muscle growth</li>\r\n    <li>Boosts immunity and overall wellness</li>\r\n    <li>Creamy, delicious, and easy to digest</li>\r\n  </ul>\r\n\r\n  <p>\r\n    Whether enjoyed with your meals, in smoothies, or as a refreshing bowl of \r\n    <em>dahi with fruits</em>, our <strong>A2 Dahi</strong> is a perfect blend of \r\n    health and taste.\r\n  </p>\r\n\r\n  <p><strong>Choose A2 Dahi</strong> — a traditional superfood for a healthier lifestyle.</p>', 60.00, 80.00, 0, '[\"1756113327509-778941795.jpg\",\"1756113327532-537492530.jpg\",\"1756113327602-920637804.jpg\",\"1756113327622-547417632.jpg\",\"1756113327640-785287461.jpg\"]', 1, NULL, '400g', '2025-08-25 09:15:27', '2025-08-29 14:15:46', '<p><strong>Gaualla A2 Dahi</strong> – Thick, creamy, and probiotic-rich, made from pure A2 milk for authentic taste.</p>\n\n<p><strong>Gaualla Fresh A2 Dahi</strong> – Naturally set, preservative-free curd packed with protein, calcium, and gut-friendly probiotics.</p>\n\n<p><strong>Gaualla Premium A2 Dahi</strong> – Soft, wholesome, and crafted from farm-fresh A2 milk for daily health and nutrition.</p>\n\n<p><strong>Gaualla Desi A2 Dahi</strong> – Traditional taste and smooth texture, perfect for meals, raitas, and healthy digestion.</p>\n\n<p><strong>Gaualla Natural A2 Dahi</strong> – A creamy delight that combines purity, health, and authentic Indian tradition.</p>\n'),
(10, 16, 'A2 White Butter', 'a2-white-butter', '<h2>A2 White Butter — Pure, Traditional & Nutritious</h2>\r\n\r\n  <p>\r\n    <strong>Our A2 White Butter</strong> is traditionally prepared from hand-churned A2 cow curd, \r\n    following the ancient <em>Bilona method</em>. Soft, creamy, and rich in flavor, it is \r\n    a natural source of wholesome nutrition and authentic taste.\r\n  </p>\r\n\r\n  <p>\r\n    Packed with <strong>healthy fats</strong>, <strong>vitamins A, D, E, K</strong>, \r\n    and essential nutrients, A2 White Butter supports digestion, boosts energy, \r\n    strengthens immunity, and nourishes overall health. Its cooling properties \r\n    make it light on the stomach and suitable for daily consumption.\r\n  </p>\r\n\r\n  <h3>Health Benefits of A2 White Butter</h3>\r\n  <ul>\r\n    <li>Boosts energy and stamina naturally</li>\r\n    <li>Rich in fat-soluble vitamins for immunity & wellness</li>\r\n    <li>Supports healthy digestion and gut health</li>\r\n    <li>Promotes glowing skin and strong bones</li>\r\n    <li>Prepared using the traditional Bilona method</li>\r\n  </ul>\r\n\r\n  <p>\r\n    Spread it on chapatis, add it to parathas, or enjoy a spoonful every day — \r\n    <strong>A2 White Butter</strong> brings back the taste of tradition with \r\n    the goodness of nature.\r\n  </p>\r\n\r\n  <p><strong>Choose A2 White Butter</strong> — soft, creamy, and full of natural health.</p>', 180.00, 220.00, 0, '[\"1756113396447-946840848.jpg\",\"1756113396476-911309579.jpg\",\"1756113396511-700157125.jpg\",\"1756113396545-200357844.jpg\",\"1756113396573-113099052.jpg\"]', 1, NULL, '200g', '2025-08-25 09:16:36', '2025-08-29 14:15:54', '<p><strong>Gaualla A2 White Butter</strong> – Soft, creamy, and preservative-free, made from pure A2 milk.</p>\n\n<p><strong>Gaualla Fresh A2 White Butter</strong> – A traditional delight, rich in healthy fats and full of authentic flavor.</p>\n\n<p><strong>Gaualla Desi A2 White Butter</strong> – Handcrafted the traditional way for purity, taste, and nutrition.</p>\n\n<p><strong>Gaualla Premium A2 White Butter</strong> – Smooth, wholesome, and perfect for parathas, bread, and homemade delicacies.</p>\n\n<p><strong>Gaualla Natural A2 White Butter</strong> – 100% pure, preservative-free, and packed with the goodness of A2 milk.</p>\n');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `created_at`, `updated_at`) VALUES
(6, 'vivek', 'vivek@mail.com', '9876543210', '$2b$10$z6l0AoUsqaPTzMEzeiDsj.XocmHo8rgfMlp3SU43sECp7auepfSfG', '2025-08-26 12:44:24', '2025-08-26 12:44:24');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `newaddresses`
--
ALTER TABLE `newaddresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `site_user_id` (`site_user_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `site_user_id` (`site_user_id`),
  ADD KEY `address_id` (`address_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `banners`
--
ALTER TABLE `banners`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `blogs`
--
ALTER TABLE `blogs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `newaddresses`
--
ALTER TABLE `newaddresses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `carts`
--
ALTER TABLE `carts`
  ADD CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `newaddresses`
--
ALTER TABLE `newaddresses`
  ADD CONSTRAINT `fk_newaddresses_user` FOREIGN KEY (`site_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_order_address` FOREIGN KEY (`address_id`) REFERENCES `newaddresses` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_order_user` FOREIGN KEY (`site_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_item_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_order_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
