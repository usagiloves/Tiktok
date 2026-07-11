--
-- PostgreSQL database dump
--

\restrict izr2PeV2KD1fEedfOYbvgcijNXtrBfCj2Vrdhpbcvk4TcaUDicHdUfrN5z2rXGt

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP INDEX public.webhook_events_processed_idx;
DROP INDEX public.webhook_events_platform_event_id_key;
DROP INDEX public.tiktok_tokens_shop_id_key;
DROP INDEX public.sync_logs_sync_key_idx;
DROP INDEX public.sync_logs_status_idx;
DROP INDEX public.sync_logs_created_at_idx;
DROP INDEX public.shops_platform_shop_id_key;
DROP INDEX public.normalized_requests_sync_key_key;
DROP INDEX public.normalized_requests_request_type_idx;
DROP INDEX public.normalized_requests_platform_shop_id_idx;
DROP INDEX public.normalized_requests_order_id_idx;
DROP INDEX public.normalized_requests_last_tiktok_update_time_idx;
DROP INDEX public.lark_records_sync_key_key;
ALTER TABLE ONLY public.webhook_events DROP CONSTRAINT webhook_events_pkey;
ALTER TABLE ONLY public.tiktok_tokens DROP CONSTRAINT tiktok_tokens_pkey;
ALTER TABLE ONLY public.sync_logs DROP CONSTRAINT sync_logs_pkey;
ALTER TABLE ONLY public.shops DROP CONSTRAINT shops_pkey;
ALTER TABLE ONLY public.normalized_requests DROP CONSTRAINT normalized_requests_pkey;
ALTER TABLE ONLY public.lark_records DROP CONSTRAINT lark_records_pkey;
ALTER TABLE public.webhook_events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.tiktok_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.sync_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.shops ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.normalized_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.lark_records ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.webhook_events_id_seq;
DROP TABLE public.webhook_events;
DROP SEQUENCE public.tiktok_tokens_id_seq;
DROP TABLE public.tiktok_tokens;
DROP SEQUENCE public.sync_logs_id_seq;
DROP TABLE public.sync_logs;
DROP SEQUENCE public.shops_id_seq;
DROP TABLE public.shops;
DROP SEQUENCE public.normalized_requests_id_seq;
DROP TABLE public.normalized_requests;
DROP SEQUENCE public.lark_records_id_seq;
DROP TABLE public.lark_records;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: lark_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lark_records (
    id integer NOT NULL,
    sync_key character varying(500) NOT NULL,
    lark_app_token character varying(255) NOT NULL,
    lark_table_id character varying(255) NOT NULL,
    lark_record_id character varying(255) NOT NULL,
    last_synced_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.lark_records OWNER TO postgres;

--
-- Name: lark_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lark_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lark_records_id_seq OWNER TO postgres;

--
-- Name: lark_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lark_records_id_seq OWNED BY public.lark_records.id;


--
-- Name: normalized_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.normalized_requests (
    id integer NOT NULL,
    sync_key character varying(500) NOT NULL,
    platform character varying(50) NOT NULL,
    shop_id character varying(100) NOT NULL,
    brand character varying(100),
    order_id character varying(100) NOT NULL,
    request_id character varying(100),
    request_type character varying(50),
    internal_status character varying(100),
    is_complaint boolean DEFAULT false NOT NULL,
    order_created_at timestamp(3) without time zone,
    warehouse_received_at timestamp(3) without time zone,
    last_tiktok_update_time timestamp(3) without time zone,
    payload jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.normalized_requests OWNER TO postgres;

--
-- Name: normalized_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.normalized_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.normalized_requests_id_seq OWNER TO postgres;

--
-- Name: normalized_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.normalized_requests_id_seq OWNED BY public.normalized_requests.id;


--
-- Name: shops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shops (
    id integer NOT NULL,
    platform character varying(50) NOT NULL,
    shop_id character varying(100) NOT NULL,
    shop_name character varying(255),
    brand character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    timezone character varying(50) DEFAULT 'Asia/Ho_Chi_Minh'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    shop_cipher character varying(255)
);


ALTER TABLE public.shops OWNER TO postgres;

--
-- Name: shops_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shops_id_seq OWNER TO postgres;

--
-- Name: shops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shops_id_seq OWNED BY public.shops.id;


--
-- Name: sync_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sync_logs (
    id integer NOT NULL,
    trace_id character varying(100),
    sync_key character varying(500),
    action character varying(50),
    source character varying(50),
    status character varying(50),
    error_message text,
    payload_snapshot jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sync_logs OWNER TO postgres;

--
-- Name: sync_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sync_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sync_logs_id_seq OWNER TO postgres;

--
-- Name: sync_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sync_logs_id_seq OWNED BY public.sync_logs.id;


--
-- Name: tiktok_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tiktok_tokens (
    id integer NOT NULL,
    shop_id character varying(100) NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    access_token_expired_at timestamp(3) without time zone,
    refresh_token_expired_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.tiktok_tokens OWNER TO postgres;

--
-- Name: tiktok_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tiktok_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tiktok_tokens_id_seq OWNER TO postgres;

--
-- Name: tiktok_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tiktok_tokens_id_seq OWNED BY public.tiktok_tokens.id;


--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.webhook_events (
    id integer NOT NULL,
    platform character varying(50) NOT NULL,
    event_type character varying(100),
    event_id character varying(255),
    shop_id character varying(100),
    order_id character varying(100),
    raw_payload jsonb,
    signature_valid boolean,
    processed boolean DEFAULT false NOT NULL,
    processed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.webhook_events OWNER TO postgres;

--
-- Name: webhook_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.webhook_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.webhook_events_id_seq OWNER TO postgres;

--
-- Name: webhook_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.webhook_events_id_seq OWNED BY public.webhook_events.id;


--
-- Name: lark_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lark_records ALTER COLUMN id SET DEFAULT nextval('public.lark_records_id_seq'::regclass);


--
-- Name: normalized_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.normalized_requests ALTER COLUMN id SET DEFAULT nextval('public.normalized_requests_id_seq'::regclass);


--
-- Name: shops id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops ALTER COLUMN id SET DEFAULT nextval('public.shops_id_seq'::regclass);


--
-- Name: sync_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_logs ALTER COLUMN id SET DEFAULT nextval('public.sync_logs_id_seq'::regclass);


--
-- Name: tiktok_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tiktok_tokens ALTER COLUMN id SET DEFAULT nextval('public.tiktok_tokens_id_seq'::regclass);


--
-- Name: webhook_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_events ALTER COLUMN id SET DEFAULT nextval('public.webhook_events_id_seq'::regclass);


--
-- Data for Name: lark_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lark_records (id, sync_key, lark_app_token, lark_table_id, lark_record_id, last_synced_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: normalized_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.normalized_requests (id, sync_key, platform, shop_id, brand, order_id, request_id, request_type, internal_status, is_complaint, order_created_at, warehouse_received_at, last_tiktok_update_time, payload, created_at, updated_at) FROM stdin;
1	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584855110257444427_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584855110257444427	\N	ORDER	Đang giao	f	2026-07-04 12:20:43	\N	2026-07-07 07:31:04	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584855110257444427_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409534473, "Mã đơn gốc": "584855110257444427", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/04 19:20", "Ghi chú hệ thống": "Đơn hàng 584855110257444427. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409464000}	2026-07-07 07:32:14.49	2026-07-07 07:32:14.49
2	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584856091551893477_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584856091551893477	\N	ORDER	Đang giao	f	2026-07-04 13:11:59	\N	2026-07-07 06:36:30	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584856091551893477_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409534896, "Mã đơn gốc": "584856091551893477", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/04 20:11", "Ghi chú hệ thống": "Đơn hàng 584856091551893477. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783406190000}	2026-07-07 07:32:14.898	2026-07-07 07:32:14.898
3	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584855978807035888_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584855978807035888	\N	ORDER	Đang giao	f	2026-07-04 13:13:40	\N	2026-07-07 06:58:49	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584855978807035888_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409535124, "Mã đơn gốc": "584855978807035888", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/04 20:13", "Ghi chú hệ thống": "Đơn hàng 584855978807035888. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783407529000}	2026-07-07 07:32:15.134	2026-07-07 07:32:15.134
4	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584856655493236621_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584856655493236621	\N	ORDER	Đã giao	f	2026-07-04 13:46:20	\N	2026-07-07 07:14:06	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584856655493236621_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409535371, "Mã đơn gốc": "584856655493236621", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/04 20:46", "Ghi chú hệ thống": "Đơn hàng 584856655493236621. Trạng thái: Đã giao", "Tình trạng xử lý": "Đã giao", "last_tiktok_update_time": 1783408446000}	2026-07-07 07:32:15.374	2026-07-07 07:32:15.374
5	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584857248152848347_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584857248152848347	\N	ORDER	Đang giao	f	2026-07-04 14:22:36	\N	2026-07-07 07:16:33	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584857248152848347_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409535667, "Mã đơn gốc": "584857248152848347", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/04 21:22", "Ghi chú hệ thống": "Đơn hàng 584857248152848347. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783408593000}	2026-07-07 07:32:15.67	2026-07-07 07:32:15.67
6	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584857476565009654_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584857476565009654	\N	ORDER	Đang giao	f	2026-07-04 14:33:19	\N	2026-07-07 07:21:11	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584857476565009654_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409535990, "Mã đơn gốc": "584857476565009654", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/04 21:33", "Ghi chú hệ thống": "Đơn hàng 584857476565009654. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783408871000}	2026-07-07 07:32:15.994	2026-07-07 07:32:15.994
7	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584858677007189551_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584858677007189551	\N	ORDER	Đã giao	f	2026-07-04 15:50:59	\N	2026-07-07 06:40:24	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584858677007189551_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409536312, "Mã đơn gốc": "584858677007189551", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/04 22:50", "Ghi chú hệ thống": "Đơn hàng 584858677007189551. Trạng thái: Đã giao", "Tình trạng xử lý": "Đã giao", "last_tiktok_update_time": 1783406424000}	2026-07-07 07:32:16.317	2026-07-07 07:32:16.317
8	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584859257795807049_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584859257795807049	\N	ORDER	Đang giao	f	2026-07-04 16:41:56	\N	2026-07-07 07:31:15	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584859257795807049_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409536606, "Mã đơn gốc": "584859257795807049", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/04 23:41", "Ghi chú hệ thống": "Đơn hàng 584859257795807049. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409475000}	2026-07-07 07:32:16.611	2026-07-07 07:32:16.611
9	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584861281363395810_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584861281363395810	\N	ORDER	Đang giao	f	2026-07-04 23:07:39	\N	2026-07-07 06:42:12	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584861281363395810_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409536896, "Mã đơn gốc": "584861281363395810", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 06:07", "Ghi chú hệ thống": "Đơn hàng 584861281363395810. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783406532000}	2026-07-07 07:32:16.903	2026-07-07 07:32:16.903
10	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584862699640751805_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584862699640751805	\N	ORDER	Đang giao	f	2026-07-05 01:34:04	\N	2026-07-07 07:31:42	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584862699640751805_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409537227, "Mã đơn gốc": "584862699640751805", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 08:34", "Ghi chú hệ thống": "Đơn hàng 584862699640751805. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409502000}	2026-07-07 07:32:17.23	2026-07-07 07:32:17.23
11	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584863404677236247_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584863404677236247	\N	ORDER	Đang giao	f	2026-07-05 02:29:07	\N	2026-07-07 07:19:19	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584863404677236247_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409537462, "Mã đơn gốc": "584863404677236247", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 09:29", "Ghi chú hệ thống": "Đơn hàng 584863404677236247. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783408759000}	2026-07-07 07:32:17.464	2026-07-07 07:32:17.464
12	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584865221901255749_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584865221901255749	\N	ORDER	Đang giao	f	2026-07-05 04:31:16	\N	2026-07-07 07:27:34	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584865221901255749_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409537745, "Mã đơn gốc": "584865221901255749", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 11:31", "Ghi chú hệ thống": "Đơn hàng 584865221901255749. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409254000}	2026-07-07 07:32:17.748	2026-07-07 07:32:17.748
13	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584866008643635093_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584866008643635093	\N	ORDER	Đã giao	f	2026-07-05 05:19:23	\N	2026-07-07 06:37:52	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584866008643635093_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409537967, "Mã đơn gốc": "584866008643635093", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 12:19", "Ghi chú hệ thống": "Đơn hàng 584866008643635093. Trạng thái: Đã giao", "Tình trạng xử lý": "Đã giao", "last_tiktok_update_time": 1783406272000}	2026-07-07 07:32:17.969	2026-07-07 07:32:17.969
14	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584866440043923099_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584866440043923099	\N	ORDER	Đang giao	f	2026-07-05 05:43:20	\N	2026-07-07 06:44:29	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584866440043923099_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409538271, "Mã đơn gốc": "584866440043923099", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 12:43", "Ghi chú hệ thống": "Đơn hàng 584866440043923099. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783406669000}	2026-07-07 07:32:18.278	2026-07-07 07:32:18.278
15	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584868113464395055_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584868113464395055	\N	ORDER	Đang giao	f	2026-07-05 07:31:10	\N	2026-07-07 06:32:27	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584868113464395055_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409538440, "Mã đơn gốc": "584868113464395055", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 14:31", "Ghi chú hệ thống": "Đơn hàng 584868113464395055. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783405947000}	2026-07-07 07:32:18.442	2026-07-07 07:32:18.442
16	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584868453147641655_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584868453147641655	\N	ORDER	Đã giao	f	2026-07-05 07:55:47	\N	2026-07-07 07:06:13	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584868453147641655_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409538829, "Mã đơn gốc": "584868453147641655", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 14:55", "Ghi chú hệ thống": "Đơn hàng 584868453147641655. Trạng thái: Đã giao", "Tình trạng xử lý": "Đã giao", "last_tiktok_update_time": 1783407973000}	2026-07-07 07:32:18.831	2026-07-07 07:32:18.831
17	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584869516890703277_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584869516890703277	\N	ORDER	Đang giao	f	2026-07-05 09:09:01	\N	2026-07-07 06:33:08	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584869516890703277_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409539055, "Mã đơn gốc": "584869516890703277", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 16:09", "Ghi chú hệ thống": "Đơn hàng 584869516890703277. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783405988000}	2026-07-07 07:32:19.058	2026-07-07 07:32:19.058
18	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584869793897154376_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584869793897154376	\N	ORDER	Đang giao	f	2026-07-05 09:23:50	\N	2026-07-07 06:50:34	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584869793897154376_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409539334, "Mã đơn gốc": "584869793897154376", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 16:23", "Ghi chú hệ thống": "Đơn hàng 584869793897154376. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783407034000}	2026-07-07 07:32:19.34	2026-07-07 07:32:19.34
19	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584870400423921015_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584870400423921015	\N	ORDER	Đang giao	f	2026-07-05 10:13:32	\N	2026-07-07 06:47:57	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584870400423921015_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409539576, "Mã đơn gốc": "584870400423921015", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 17:13", "Ghi chú hệ thống": "Đơn hàng 584870400423921015. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783406877000}	2026-07-07 07:32:19.578	2026-07-07 07:32:19.578
20	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584872126799119552_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584872126799119552	\N	ORDER	Đã giao	f	2026-07-05 12:08:21	\N	2026-07-07 07:19:38	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584872126799119552_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409539843, "Mã đơn gốc": "584872126799119552", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 19:08", "Ghi chú hệ thống": "Đơn hàng 584872126799119552. Trạng thái: Đã giao", "Tình trạng xử lý": "Đã giao", "last_tiktok_update_time": 1783408778000}	2026-07-07 07:32:19.847	2026-07-07 07:32:19.847
21	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584873192247952672_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584873192247952672	\N	ORDER	Đang giao	f	2026-07-05 13:12:52	\N	2026-07-07 06:53:59	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584873192247952672_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409540069, "Mã đơn gốc": "584873192247952672", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 20:12", "Ghi chú hệ thống": "Đơn hàng 584873192247952672. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783407239000}	2026-07-07 07:32:20.071	2026-07-07 07:32:20.071
22	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584873298554947469_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584873298554947469	\N	ORDER	Đang giao	f	2026-07-05 13:21:03	\N	2026-07-07 07:12:33	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584873298554947469_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409540399, "Mã đơn gốc": "584873298554947469", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 20:21", "Ghi chú hệ thống": "Đơn hàng 584873298554947469. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783408353000}	2026-07-07 07:32:20.401	2026-07-07 07:32:20.401
23	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584875026823677717_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584875026823677717	\N	ORDER	Đã giao	f	2026-07-05 14:50:52	\N	2026-07-07 07:11:27	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584875026823677717_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409540643, "Mã đơn gốc": "584875026823677717", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 21:50", "Ghi chú hệ thống": "Đơn hàng 584875026823677717. Trạng thái: Đã giao", "Tình trạng xử lý": "Đã giao", "last_tiktok_update_time": 1783408287000}	2026-07-07 07:32:20.65	2026-07-07 07:32:20.65
24	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584875350759998627_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584875350759998627	\N	ORDER	Đang giao	f	2026-07-05 15:10:12	\N	2026-07-07 07:03:41	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584875350759998627_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409541027, "Mã đơn gốc": "584875350759998627", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 22:10", "Ghi chú hệ thống": "Đơn hàng 584875350759998627. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783407821000}	2026-07-07 07:32:21.03	2026-07-07 07:32:21.03
25	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584875449802327874_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584875449802327874	\N	ORDER	Đang giao	f	2026-07-05 15:21:12	\N	2026-07-07 06:34:14	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584875449802327874_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409541319, "Mã đơn gốc": "584875449802327874", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 22:21", "Ghi chú hệ thống": "Đơn hàng 584875449802327874. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783406054000}	2026-07-07 07:32:21.322	2026-07-07 07:32:21.322
26	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584876452876944569_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584876452876944569	\N	ORDER	Đang giao	f	2026-07-05 16:29:49	\N	2026-07-07 06:55:55	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584876452876944569_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409541556, "Mã đơn gốc": "584876452876944569", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 23:29", "Ghi chú hệ thống": "Đơn hàng 584876452876944569. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783407355000}	2026-07-07 07:32:21.559	2026-07-07 07:32:21.559
27	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584876546862909225_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584876546862909225	\N	ORDER	Đang giao	f	2026-07-05 16:36:03	\N	2026-07-07 07:31:19	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584876546862909225_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409541842, "Mã đơn gốc": "584876546862909225", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/05 23:36", "Ghi chú hệ thống": "Đơn hàng 584876546862909225. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409479000}	2026-07-07 07:32:21.846	2026-07-07 07:32:21.846
28	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584878403570992278_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584878403570992278	\N	ORDER	Đang giao	f	2026-07-05 22:39:37	\N	2026-07-07 06:42:52	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584878403570992278_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409542066, "Mã đơn gốc": "584878403570992278", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 05:39", "Ghi chú hệ thống": "Đơn hàng 584878403570992278. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783406572000}	2026-07-07 07:32:22.074	2026-07-07 07:32:22.074
29	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584878869540078773_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584878869540078773	\N	ORDER	Đang giao	f	2026-07-05 23:44:41	\N	2026-07-07 06:46:32	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584878869540078773_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409542455, "Mã đơn gốc": "584878869540078773", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 06:44", "Ghi chú hệ thống": "Đơn hàng 584878869540078773. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783406792000}	2026-07-07 07:32:22.458	2026-07-07 07:32:22.458
30	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584879344476587077_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584879344476587077	\N	ORDER	Đang giao	f	2026-07-06 00:32:16	\N	2026-07-07 07:23:15	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584879344476587077_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409542664, "Mã đơn gốc": "584879344476587077", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 07:32", "Ghi chú hệ thống": "Đơn hàng 584879344476587077. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783408995000}	2026-07-07 07:32:22.668	2026-07-07 07:32:22.668
31	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584880367815525988_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584880367815525988	\N	ORDER	Đang giao	f	2026-07-06 02:02:35	\N	2026-07-07 07:13:49	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584880367815525988_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409542879, "Mã đơn gốc": "584880367815525988", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 09:02", "Ghi chú hệ thống": "Đơn hàng 584880367815525988. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783408429000}	2026-07-07 07:32:22.881	2026-07-07 07:32:22.881
32	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584880882667194119_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584880882667194119	\N	ORDER	Đang giao	f	2026-07-06 02:37:17	\N	2026-07-07 07:02:13	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584880882667194119_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409543099, "Mã đơn gốc": "584880882667194119", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 09:37", "Ghi chú hệ thống": "Đơn hàng 584880882667194119. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783407733000}	2026-07-07 07:32:23.101	2026-07-07 07:32:23.101
33	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584881956279453315_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584881956279453315	\N	ORDER	Đang giao	f	2026-07-06 03:52:33	\N	2026-07-07 07:11:05	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584881956279453315_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409543245, "Mã đơn gốc": "584881956279453315", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 10:52", "Ghi chú hệ thống": "Đơn hàng 584881956279453315. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783408265000}	2026-07-07 07:32:23.248	2026-07-07 07:32:23.248
34	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584882690014610593_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584882690014610593	\N	ORDER	Đang giao	f	2026-07-06 04:50:27	\N	2026-07-07 06:38:48	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584882690014610593_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409543569, "Mã đơn gốc": "584882690014610593", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 11:50", "Ghi chú hệ thống": "Đơn hàng 584882690014610593. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783406328000}	2026-07-07 07:32:23.573	2026-07-07 07:32:23.573
35	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584883628528993337_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584883628528993337	\N	ORDER	Đang giao	f	2026-07-06 05:48:51	\N	2026-07-07 07:09:23	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584883628528993337_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409543913, "Mã đơn gốc": "584883628528993337", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 12:48", "Ghi chú hệ thống": "Đơn hàng 584883628528993337. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783408163000}	2026-07-07 07:32:23.92	2026-07-07 07:32:23.92
36	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584884039482181563_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584884039482181563	\N	ORDER	Đã giao	f	2026-07-06 06:15:44	\N	2026-07-07 06:45:57	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584884039482181563_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409544207, "Mã đơn gốc": "584884039482181563", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 13:15", "Ghi chú hệ thống": "Đơn hàng 584884039482181563. Trạng thái: Đã giao", "Tình trạng xử lý": "Đã giao", "last_tiktok_update_time": 1783406757000}	2026-07-07 07:32:24.209	2026-07-07 07:32:24.209
37	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584884711766919002_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584884711766919002	\N	ORDER	Đã giao	f	2026-07-06 06:58:37	\N	2026-07-07 07:06:29	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584884711766919002_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409544474, "Mã đơn gốc": "584884711766919002", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 13:58", "Ghi chú hệ thống": "Đơn hàng 584884711766919002. Trạng thái: Đã giao", "Tình trạng xử lý": "Đã giao", "last_tiktok_update_time": 1783407989000}	2026-07-07 07:32:24.476	2026-07-07 07:32:24.476
38	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584884776316208384_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584884776316208384	\N	ORDER	Đang giao	f	2026-07-06 07:02:15	\N	2026-07-07 07:26:45	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584884776316208384_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409544783, "Mã đơn gốc": "584884776316208384", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 14:02", "Ghi chú hệ thống": "Đơn hàng 584884776316208384. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409205000}	2026-07-07 07:32:24.786	2026-07-07 07:32:24.786
39	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584886336894437125_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584886336894437125	\N	ORDER	Đã giao	f	2026-07-06 08:55:05	\N	2026-07-07 06:39:41	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584886336894437125_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409545105, "Mã đơn gốc": "584886336894437125", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 15:55", "Ghi chú hệ thống": "Đơn hàng 584886336894437125. Trạng thái: Đã giao", "Tình trạng xử lý": "Đã giao", "last_tiktok_update_time": 1783406381000}	2026-07-07 07:32:25.112	2026-07-07 07:32:25.112
40	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584886743984014387_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584886743984014387	\N	ORDER	Đang giao	f	2026-07-06 09:24:17	\N	2026-07-07 07:13:58	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584886743984014387_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409545301, "Mã đơn gốc": "584886743984014387", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 16:24", "Ghi chú hệ thống": "Đơn hàng 584886743984014387. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783408438000}	2026-07-07 07:32:25.303	2026-07-07 07:32:25.303
41	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584886856610907286_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584886856610907286	\N	ORDER	Đang giao	f	2026-07-06 09:30:52	\N	2026-07-07 07:19:28	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584886856610907286_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409545515, "Mã đơn gốc": "584886856610907286", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 16:30", "Ghi chú hệ thống": "Đơn hàng 584886856610907286. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783408768000}	2026-07-07 07:32:25.517	2026-07-07 07:32:25.517
42	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584886941544514686_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584886941544514686	\N	ORDER	Đã giao	f	2026-07-06 09:36:56	\N	2026-07-07 06:53:45	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584886941544514686_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409545820, "Mã đơn gốc": "584886941544514686", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 16:36", "Ghi chú hệ thống": "Đơn hàng 584886941544514686. Trạng thái: Đã giao", "Tình trạng xử lý": "Đã giao", "last_tiktok_update_time": 1783407225000}	2026-07-07 07:32:25.823	2026-07-07 07:32:25.823
43	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888224860309130_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584888224860309130	\N	ORDER	Đang giao	f	2026-07-06 11:08:05	\N	2026-07-07 07:26:30	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888224860309130_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409546042, "Mã đơn gốc": "584888224860309130", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 18:08", "Ghi chú hệ thống": "Đơn hàng 584888224860309130. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409190000}	2026-07-07 07:32:26.044	2026-07-07 07:32:26.044
44	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888358729057380_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584888358729057380	\N	ORDER	Đang giao	f	2026-07-06 11:17:40	\N	2026-07-07 07:26:30	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888358729057380_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409546303, "Mã đơn gốc": "584888358729057380", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 18:17", "Ghi chú hệ thống": "Đơn hàng 584888358729057380. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409190000}	2026-07-07 07:32:26.305	2026-07-07 07:32:26.305
45	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888366780876490_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584888366780876490	\N	ORDER	Đang giao	f	2026-07-06 11:22:04	\N	2026-07-07 07:26:30	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888366780876490_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409546530, "Mã đơn gốc": "584888366780876490", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 18:22", "Ghi chú hệ thống": "Đơn hàng 584888366780876490. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409190000}	2026-07-07 07:32:26.534	2026-07-07 07:32:26.534
46	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888574067508677_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584888574067508677	\N	ORDER	Đang giao	f	2026-07-06 11:31:32	\N	2026-07-07 07:26:30	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888574067508677_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409546887, "Mã đơn gốc": "584888574067508677", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 18:31", "Ghi chú hệ thống": "Đơn hàng 584888574067508677. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409190000}	2026-07-07 07:32:26.89	2026-07-07 07:32:26.89
47	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888629630765052_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584888629630765052	\N	ORDER	Đang giao	f	2026-07-06 11:35:54	\N	2026-07-07 07:26:30	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888629630765052_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409547109, "Mã đơn gốc": "584888629630765052", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 18:35", "Ghi chú hệ thống": "Đơn hàng 584888629630765052. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783409190000}	2026-07-07 07:32:27.111	2026-07-07 07:32:27.111
48	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888977087039019_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584888977087039019	\N	ORDER	Đang giao	f	2026-07-06 11:55:12	\N	2026-07-07 06:55:24	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888977087039019_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409547503, "Mã đơn gốc": "584888977087039019", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 18:55", "Ghi chú hệ thống": "Đơn hàng 584888977087039019. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783407324000}	2026-07-07 07:32:27.506	2026-07-07 07:32:27.506
49	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888985669305999_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584888985669305999	\N	ORDER	Đang giao	f	2026-07-06 11:57:56	\N	2026-07-07 06:55:24	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584888985669305999_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409547669, "Mã đơn gốc": "584888985669305999", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 18:57", "Ghi chú hệ thống": "Đơn hàng 584888985669305999. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783407324000}	2026-07-07 07:32:27.676	2026-07-07 07:32:27.676
50	TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584889151667995703_ORDER_ONLY	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT	584889151667995703	\N	ORDER	Đang giao	f	2026-07-06 12:09:11	\N	2026-07-07 06:55:24	{"shop_id": "Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q", "platform": "TIKTOK", "sync_key": "TIKTOK_Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q_GOODFIT_584889151667995703_ORDER_ONLY", "Kênh bán": "TikTok", "request_id": "", "sync_error": "", "sync_status": "SUCCESS", "Khiếu nại": "Không", "Ngày về kho": "", "last_synced_at": 1783409547897, "Mã đơn gốc": "584889151667995703", "Mã đơn trả": "", "Thương hiệu": "GOODFIT", "Loại yêu cầu": "Đơn hàng", "Ngày tạo đơn": "2026/07/06 19:09", "Ghi chú hệ thống": "Đơn hàng 584889151667995703. Trạng thái: Đang giao", "Tình trạng xử lý": "Đang giao", "last_tiktok_update_time": 1783407324000}	2026-07-07 07:32:27.899	2026-07-07 07:32:27.899
\.


--
-- Data for Name: shops; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shops (id, platform, shop_id, shop_name, brand, is_active, timezone, created_at, updated_at, shop_cipher) FROM stdin;
1	TIKTOK	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	GOODFIT Vietnam	GOODFIT	t	Asia/Ho_Chi_Minh	2026-07-07 07:25:44.858	2026-07-07 07:25:44.858	ROW_D2UeSQAAAAB1IwVpcgK75rvfJTgtS1y3
\.


--
-- Data for Name: sync_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sync_logs (id, trace_id, sync_key, action, source, status, error_message, payload_snapshot, created_at) FROM stdin;
\.


--
-- Data for Name: tiktok_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tiktok_tokens (id, shop_id, access_token, refresh_token, access_token_expired_at, refresh_token_expired_at, created_at, updated_at) FROM stdin;
1	Twe5AAAAAAC7LjvzzxvKXhqKg0_mavCC_H5zpYK9JU1jo3Ok4he96Q	ROW_inCgMwAAAABU7eVhtyT5rzIiTpdJNewY_jcchbzUoI4WGRMhV0K807grjjAiq3r8iM_ro7fbHgns2ALmIImk8Ex8JmNCSkDVJ7Mcab6iwPvASe-y8Dd9kwVFhKttJl_ElugvoiM9b51a220VHPsOrt10BJwRYS4-zOX_Jt5nu1zyZ83CBHeZn-to0XzBUQqtbLpIbcEG71k	ROW_F0pPzAAAAABYi9_V2I5yqXKVwxYP8omIs7BglxuRnz5EdCjIs-FJjKYekVlSaAo2ezTu1T8LrRo	2083-01-17 13:34:48.479	2181-12-17 13:34:33.479	2026-07-07 06:47:25.492	2026-07-07 06:47:25.492
\.


--
-- Data for Name: webhook_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.webhook_events (id, platform, event_type, event_id, shop_id, order_id, raw_payload, signature_valid, processed, processed_at, created_at) FROM stdin;
\.


--
-- Name: lark_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lark_records_id_seq', 1, false);


--
-- Name: normalized_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.normalized_requests_id_seq', 50, true);


--
-- Name: shops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shops_id_seq', 1, true);


--
-- Name: sync_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sync_logs_id_seq', 1, false);


--
-- Name: tiktok_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tiktok_tokens_id_seq', 1, true);


--
-- Name: webhook_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.webhook_events_id_seq', 1, false);


--
-- Name: lark_records lark_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lark_records
    ADD CONSTRAINT lark_records_pkey PRIMARY KEY (id);


--
-- Name: normalized_requests normalized_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.normalized_requests
    ADD CONSTRAINT normalized_requests_pkey PRIMARY KEY (id);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- Name: tiktok_tokens tiktok_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tiktok_tokens
    ADD CONSTRAINT tiktok_tokens_pkey PRIMARY KEY (id);


--
-- Name: webhook_events webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);


--
-- Name: lark_records_sync_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX lark_records_sync_key_key ON public.lark_records USING btree (sync_key);


--
-- Name: normalized_requests_last_tiktok_update_time_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX normalized_requests_last_tiktok_update_time_idx ON public.normalized_requests USING btree (last_tiktok_update_time);


--
-- Name: normalized_requests_order_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX normalized_requests_order_id_idx ON public.normalized_requests USING btree (order_id);


--
-- Name: normalized_requests_platform_shop_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX normalized_requests_platform_shop_id_idx ON public.normalized_requests USING btree (platform, shop_id);


--
-- Name: normalized_requests_request_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX normalized_requests_request_type_idx ON public.normalized_requests USING btree (request_type);


--
-- Name: normalized_requests_sync_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX normalized_requests_sync_key_key ON public.normalized_requests USING btree (sync_key);


--
-- Name: shops_platform_shop_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX shops_platform_shop_id_key ON public.shops USING btree (platform, shop_id);


--
-- Name: sync_logs_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sync_logs_created_at_idx ON public.sync_logs USING btree (created_at);


--
-- Name: sync_logs_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sync_logs_status_idx ON public.sync_logs USING btree (status);


--
-- Name: sync_logs_sync_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sync_logs_sync_key_idx ON public.sync_logs USING btree (sync_key);


--
-- Name: tiktok_tokens_shop_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tiktok_tokens_shop_id_key ON public.tiktok_tokens USING btree (shop_id);


--
-- Name: webhook_events_platform_event_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX webhook_events_platform_event_id_key ON public.webhook_events USING btree (platform, event_id);


--
-- Name: webhook_events_processed_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX webhook_events_processed_idx ON public.webhook_events USING btree (processed);


--
-- PostgreSQL database dump complete
--

\unrestrict izr2PeV2KD1fEedfOYbvgcijNXtrBfCj2Vrdhpbcvk4TcaUDicHdUfrN5z2rXGt

