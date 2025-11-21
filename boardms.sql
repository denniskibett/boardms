--
-- PostgreSQL database dump
--

\restrict 2j3gNbPboEhjeI5oLXy8IWONY1qCJVLAeaECk0rjjvWjkAvimenQRKrcobQz8Gi

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

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

--
-- Name: set_admin_status(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.set_admin_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.role = 'Admin' THEN
        NEW.status := 'active';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_admin_status() OWNER TO admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: action_letters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.action_letters (
    id integer NOT NULL,
    deliberation_id integer,
    to_ministry_id integer,
    document_id integer,
    subject character varying(500),
    content text,
    due_date date,
    status character varying(50) DEFAULT 'pending'::character varying,
    sent_at timestamp without time zone,
    acknowledged_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.action_letters OWNER TO postgres;

--
-- Name: action_letters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.action_letters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.action_letters_id_seq OWNER TO postgres;

--
-- Name: action_letters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.action_letters_id_seq OWNED BY public.action_letters.id;


--
-- Name: agencies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agencies (
    id integer NOT NULL,
    state_department_id integer,
    name character varying(255) NOT NULL,
    director_general character varying(255),
    acronym character varying(255),
    location character varying(255),
    website character varying(255),
    email character varying(255),
    phone character varying(255),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.agencies OWNER TO postgres;

--
-- Name: agencies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.agencies_id_seq OWNER TO postgres;

--
-- Name: agencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agencies_id_seq OWNED BY public.agencies.id;


--
-- Name: agenda; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agenda (
    id integer NOT NULL,
    meeting_id integer,
    memo_id integer,
    name character varying(500) NOT NULL,
    ministry_id integer,
    presenter_id integer,
    sort_order integer,
    description text,
    status character varying(20) DEFAULT 'pending'::character varying,
    cabinet_approval_required boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


ALTER TABLE public.agenda OWNER TO postgres;

--
-- Name: agenda_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agenda_documents (
    id integer NOT NULL,
    agenda_id integer,
    name text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    file_type text,
    file_url text,
    file_size integer,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    metadata jsonb,
    uploaded_by integer
);


ALTER TABLE public.agenda_documents OWNER TO postgres;

--
-- Name: agenda_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agenda_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.agenda_documents_id_seq OWNER TO postgres;

--
-- Name: agenda_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agenda_documents_id_seq OWNED BY public.agenda_documents.id;


--
-- Name: agenda_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.agenda_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.agenda_id_seq OWNER TO postgres;

--
-- Name: agenda_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.agenda_id_seq OWNED BY public.agenda.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    target_type character varying(100),
    target_id integer,
    metadata jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: cabinet_committees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cabinet_committees (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    cluster_id integer,
    chair_title character varying(100) DEFAULT 'Deputy President'::character varying,
    description text,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cabinet_committees OWNER TO postgres;

--
-- Name: cabinet_committees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cabinet_committees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cabinet_committees_id_seq OWNER TO postgres;

--
-- Name: cabinet_committees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cabinet_committees_id_seq OWNED BY public.cabinet_committees.id;


--
-- Name: cabinet_releases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cabinet_releases (
    id integer NOT NULL,
    meeting_id integer,
    document_id integer,
    title character varying(500),
    content text,
    release_type character varying(50) DEFAULT 'confidential'::character varying,
    published_by integer,
    published_at timestamp without time zone,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cabinet_releases OWNER TO postgres;

--
-- Name: cabinet_releases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cabinet_releases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cabinet_releases_id_seq OWNER TO postgres;

--
-- Name: cabinet_releases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cabinet_releases_id_seq OWNED BY public.cabinet_releases.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    icon character varying(100),
    colour character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO admin;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO admin;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: clusters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clusters (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    chair_ministry_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.clusters OWNER TO postgres;

--
-- Name: clusters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clusters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.clusters_id_seq OWNER TO postgres;

--
-- Name: clusters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clusters_id_seq OWNED BY public.clusters.id;


--
-- Name: deliberations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deliberations (
    id integer NOT NULL,
    agenda_id integer,
    discussion_summary text,
    recommendations text,
    decision_type character varying(50),
    decision_text text,
    requires_president_signature boolean DEFAULT false,
    signed_by integer,
    signed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.deliberations OWNER TO postgres;

--
-- Name: deliberations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.deliberations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.deliberations_id_seq OWNER TO postgres;

--
-- Name: deliberations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deliberations_id_seq OWNED BY public.deliberations.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    name character varying(500) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    document_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    access_level character varying(20) DEFAULT 'restricted'::character varying,
    uploaded_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    gov_memo_id integer
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: gov_memos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gov_memos (
    id integer NOT NULL,
    name character varying(500) NOT NULL,
    summary text,
    body text,
    memo_type character varying(50) DEFAULT 'cabinet'::character varying,
    ministry_id integer,
    priority character varying(20) DEFAULT 'medium'::character varying,
    status character varying(50) DEFAULT 'draft'::character varying,
    created_by integer,
    submitted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    state_department_id integer,
    agency_id integer,
    updated_by integer
);


ALTER TABLE public.gov_memos OWNER TO postgres;

--
-- Name: gov_memos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gov_memos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gov_memos_id_seq OWNER TO postgres;

--
-- Name: gov_memos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gov_memos_id_seq OWNED BY public.gov_memos.id;


--
-- Name: group_users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.group_users (
    id integer NOT NULL,
    group_id integer,
    user_id integer,
    mandatory_id integer
);


ALTER TABLE public.group_users OWNER TO admin;

--
-- Name: group_users_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.group_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.group_users_id_seq OWNER TO admin;

--
-- Name: group_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.group_users_id_seq OWNED BY public.group_users.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.groups OWNER TO admin;

--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.groups_id_seq OWNER TO admin;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: meeting_minutes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meeting_minutes (
    id integer NOT NULL,
    meeting_id integer,
    document_id integer,
    prepared_by integer,
    approved_by integer,
    approved_at timestamp without time zone,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.meeting_minutes OWNER TO postgres;

--
-- Name: meeting_minutes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meeting_minutes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_minutes_id_seq OWNER TO postgres;

--
-- Name: meeting_minutes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meeting_minutes_id_seq OWNED BY public.meeting_minutes.id;


--
-- Name: meeting_participants; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.meeting_participants (
    id integer NOT NULL,
    meeting_id integer,
    user_id integer,
    group_id integer,
    created_at timestamp without time zone DEFAULT now(),
    rsvp_id integer
);


ALTER TABLE public.meeting_participants OWNER TO admin;

--
-- Name: meeting_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.meeting_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meeting_participants_id_seq OWNER TO admin;

--
-- Name: meeting_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.meeting_participants_id_seq OWNED BY public.meeting_participants.id;


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.meetings (
    id integer NOT NULL,
    name character varying(500) NOT NULL,
    type character varying(50) DEFAULT 'cabinet_committee'::character varying,
    start_at timestamp without time zone,
    location character varying(255),
    chair_id integer,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approved_by integer,
    created_by integer,
    description text,
    period integer,
    actual_end timestamp without time zone,
    colour character varying(20)
);


ALTER TABLE public.meetings OWNER TO postgres;

--
-- Name: meetings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.meetings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meetings_id_seq OWNER TO postgres;

--
-- Name: meetings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.meetings_id_seq OWNED BY public.meetings.id;


--
-- Name: memo_affected_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.memo_affected_entities (
    id integer NOT NULL,
    memo_id integer,
    ministry_id integer,
    state_department_id integer,
    agency_id integer,
    entity_type character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.memo_affected_entities OWNER TO postgres;

--
-- Name: memo_affected_entities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.memo_affected_entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.memo_affected_entities_id_seq OWNER TO postgres;

--
-- Name: memo_affected_entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.memo_affected_entities_id_seq OWNED BY public.memo_affected_entities.id;


--
-- Name: memo_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.memo_documents (
    id integer NOT NULL,
    memo_id integer,
    document_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.memo_documents OWNER TO postgres;

--
-- Name: memo_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.memo_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.memo_documents_id_seq OWNER TO postgres;

--
-- Name: memo_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.memo_documents_id_seq OWNED BY public.memo_documents.id;


--
-- Name: ministries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ministries (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    acronym character varying(50),
    cluster_id integer,
    cabinet_secretary integer,
    headquarters character varying(255),
    website character varying(255),
    email character varying(255),
    phone character varying(50),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ministries OWNER TO postgres;

--
-- Name: ministries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ministries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ministries_id_seq OWNER TO postgres;

--
-- Name: ministries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ministries_id_seq OWNED BY public.ministries.id;


--
-- Name: presidential_signatures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.presidential_signatures (
    id integer NOT NULL,
    document_id integer,
    signed_by integer,
    signed_at timestamp without time zone,
    signature_type character varying(50),
    reference_id integer,
    reference_type character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.presidential_signatures OWNER TO postgres;

--
-- Name: presidential_signatures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.presidential_signatures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.presidential_signatures_id_seq OWNER TO postgres;

--
-- Name: presidential_signatures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.presidential_signatures_id_seq OWNED BY public.presidential_signatures.id;


--
-- Name: resource_files; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resource_files (
    id integer NOT NULL,
    resource_id integer,
    name character varying(255) NOT NULL,
    display_name character varying(255),
    file_type character varying(50),
    file_url character varying(500),
    file_size integer,
    ministry_id integer,
    uploaded_by integer,
    uploaded_at timestamp without time zone DEFAULT now(),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.resource_files OWNER TO admin;

--
-- Name: resource_files_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.resource_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resource_files_id_seq OWNER TO admin;

--
-- Name: resource_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.resource_files_id_seq OWNED BY public.resource_files.id;


--
-- Name: resources; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resources (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    resource_type_id integer,
    year integer NOT NULL,
    description text,
    metadata jsonb,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.resources OWNER TO admin;

--
-- Name: resources_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resources_id_seq OWNER TO admin;

--
-- Name: resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.resources_id_seq OWNED BY public.resources.id;


--
-- Name: state_departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.state_departments (
    id integer NOT NULL,
    ministry_id integer,
    name character varying(255) NOT NULL,
    principal_secretary character varying(255),
    location character varying(255),
    website character varying(255),
    email character varying(255),
    phone character varying(255),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ps character varying(255)
);


ALTER TABLE public.state_departments OWNER TO postgres;

--
-- Name: state_departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.state_departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.state_departments_id_seq OWNER TO postgres;

--
-- Name: state_departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.state_departments_id_seq OWNED BY public.state_departments.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    name character varying(255) DEFAULT 'E-Cabinet System'::character varying,
    version character varying(50) DEFAULT '1.0.0'::character varying,
    timezone character varying(100) DEFAULT 'Africa/Nairobi'::character varying,
    date_format character varying(20) DEFAULT 'DD/MM/YYYY'::character varying,
    language character varying(50) DEFAULT 'English'::character varying,
    email_notifications boolean DEFAULT true,
    push_notifications boolean DEFAULT true,
    meeting_reminders boolean DEFAULT true,
    deadline_alerts boolean DEFAULT true,
    weekly_reports boolean DEFAULT false,
    session_timeout integer DEFAULT 30,
    password_policy character varying(50) DEFAULT 'strong'::character varying,
    two_factor_auth boolean DEFAULT true,
    ip_whitelist text[] DEFAULT ARRAY['192.168.1.0/24'::text],
    audit_log_retention integer DEFAULT 365,
    smtp_enabled boolean DEFAULT true,
    smtp_server character varying(255) DEFAULT 'smtp.gov.go.ke'::character varying,
    smtp_port integer DEFAULT 587,
    file_storage character varying(50) DEFAULT 'local'::character varying,
    max_file_size integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    logo character varying(255),
    slogan character varying(255)
);


ALTER TABLE public.system_settings OWNER TO admin;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_settings_id_seq OWNER TO admin;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: user_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_notes (
    id integer NOT NULL,
    user_id integer,
    agenda_id integer,
    note_type character varying(20) DEFAULT 'text'::character varying,
    content text,
    annotation_image_path character varying(500),
    page_number integer,
    coordinates jsonb,
    is_private boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_notes OWNER TO postgres;

--
-- Name: user_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_notes_id_seq OWNER TO postgres;

--
-- Name: user_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_notes_id_seq OWNED BY public.user_notes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    phone character varying(20),
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image text,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['President'::character varying, 'Deputy President'::character varying, 'Prime Cabinet Secretary'::character varying, 'Cabinet Secretary'::character varying, 'Principal Secretary'::character varying, 'Cabinet Secretariat'::character varying, 'Director'::character varying, 'Assistant Director'::character varying, 'Admin'::character varying, 'Attorney General'::character varying, 'Secretary to the Cabinet'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: action_letters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_letters ALTER COLUMN id SET DEFAULT nextval('public.action_letters_id_seq'::regclass);


--
-- Name: agencies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agencies ALTER COLUMN id SET DEFAULT nextval('public.agencies_id_seq'::regclass);


--
-- Name: agenda id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda ALTER COLUMN id SET DEFAULT nextval('public.agenda_id_seq'::regclass);


--
-- Name: agenda_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda_documents ALTER COLUMN id SET DEFAULT nextval('public.agenda_documents_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: cabinet_committees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabinet_committees ALTER COLUMN id SET DEFAULT nextval('public.cabinet_committees_id_seq'::regclass);


--
-- Name: cabinet_releases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabinet_releases ALTER COLUMN id SET DEFAULT nextval('public.cabinet_releases_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: clusters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clusters ALTER COLUMN id SET DEFAULT nextval('public.clusters_id_seq'::regclass);


--
-- Name: deliberations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliberations ALTER COLUMN id SET DEFAULT nextval('public.deliberations_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: gov_memos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_memos ALTER COLUMN id SET DEFAULT nextval('public.gov_memos_id_seq'::regclass);


--
-- Name: group_users id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.group_users ALTER COLUMN id SET DEFAULT nextval('public.group_users_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: meeting_minutes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_minutes ALTER COLUMN id SET DEFAULT nextval('public.meeting_minutes_id_seq'::regclass);


--
-- Name: meeting_participants id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.meeting_participants ALTER COLUMN id SET DEFAULT nextval('public.meeting_participants_id_seq'::regclass);


--
-- Name: meetings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings ALTER COLUMN id SET DEFAULT nextval('public.meetings_id_seq'::regclass);


--
-- Name: memo_affected_entities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_affected_entities ALTER COLUMN id SET DEFAULT nextval('public.memo_affected_entities_id_seq'::regclass);


--
-- Name: memo_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_documents ALTER COLUMN id SET DEFAULT nextval('public.memo_documents_id_seq'::regclass);


--
-- Name: ministries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ministries ALTER COLUMN id SET DEFAULT nextval('public.ministries_id_seq'::regclass);


--
-- Name: presidential_signatures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presidential_signatures ALTER COLUMN id SET DEFAULT nextval('public.presidential_signatures_id_seq'::regclass);


--
-- Name: resource_files id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_files ALTER COLUMN id SET DEFAULT nextval('public.resource_files_id_seq'::regclass);


--
-- Name: resources id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resources ALTER COLUMN id SET DEFAULT nextval('public.resources_id_seq'::regclass);


--
-- Name: state_departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_departments ALTER COLUMN id SET DEFAULT nextval('public.state_departments_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: user_notes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notes ALTER COLUMN id SET DEFAULT nextval('public.user_notes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: action_letters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.action_letters (id, deliberation_id, to_ministry_id, document_id, subject, content, due_date, status, sent_at, acknowledged_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: agencies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agencies (id, state_department_id, name, director_general, acronym, location, website, email, phone, status, created_at, updated_at) FROM stdin;
1	3	Directorate of Immigration Services	Mr. Alexander K. Muteshi	DIS	Nyayo House, Nairobi	https://immigration.go.ke	info@immigration.go.ke	+254-20-2222022	active	2025-10-19 21:57:31.01507	2025-10-19 21:57:31.01507
2	3	Department of Civil Registration Services	Ms. Jane Mwangi	CRS	Sheria House, Nairobi	https://crs.go.ke	info@crs.go.ke	+254-20-2227416	active	2025-10-19 21:57:31.01855	2025-10-19 21:57:31.01855
3	3	Integrated Population Registration Services	Director	IPRS	Nairobi, Kenya	https://iprs.go.ke	info@iprs.go.ke	+254-20-2227417	active	2025-10-19 21:57:31.019248	2025-10-19 21:57:31.019248
4	1	National Police Service	Inspector General of Police	NPS	Jogoo House, Nairobi	https://www.nationalpolice.go.ke	info@nationalpolice.go.ke	+254-20-341411	active	2025-10-19 21:57:31.019884	2025-10-19 21:57:31.019884
5	1	Directorate of Criminal Investigations	Director of Criminal Investigations	DCI	Kiambu Road, Nairobi	https://www.dci.go.ke	info@dci.go.ke	+254-20-334211	active	2025-10-19 21:57:31.020564	2025-10-19 21:57:31.020564
6	1	National Intelligence Service	Director General	NIS	NIS Headquarters, Nairobi	\N	info@nis.go.ke	+254-20-2214111	active	2025-10-19 21:57:31.021289	2025-10-19 21:57:31.021289
7	4	Kenya Medical Supplies Authority	Chief Executive Officer	KEMSA	Commercial Street, Nairobi	https://www.kemsa.co.ke	info@kemsa.co.ke	+254-20-2722527	active	2025-10-19 21:57:31.022021	2025-10-19 21:57:31.022021
8	4	Kenyatta National Hospital	Dr. Evanson Kamuri	KNH	Nairobi	https://knh.or.ke	info@knh.or.ke	+254-20-2726300	active	2025-10-19 21:57:31.022605	2025-10-19 21:57:31.022605
9	4	Moi Teaching and Referral Hospital	Dr. Wilson Aruasa	MTRH	Eldoret	https://mtrh.or.ke	info@mtrh.or.ke	+254-53-2033471	active	2025-10-19 21:57:31.023162	2025-10-19 21:57:31.023162
10	5	Kenya Medical Practitioners and Dentists Council	Dr. Daniel Yumbya	KMPDC	Nairobi	https://kmpdc.go.ke	info@kmpdc.go.ke	+254-20-2724888	active	2025-10-19 21:57:31.023828	2025-10-19 21:57:31.023828
11	5	Nursing Council of Kenya	Registrar	NCK	Nairobi	\N	\N	\N	active	2025-10-19 21:57:31.024573	2025-10-19 21:57:31.024573
12	5	Pharmacy and Poisons Board	Registrar	PPB	Nairobi	\N	\N	\N	active	2025-10-19 21:57:31.025269	2025-10-19 21:57:31.025269
13	9	Kenya Revenue Authority	Commissioner General	KRA	Times Tower, Nairobi	https://www.kra.go.ke	commissioner@kra.go.ke	+254-20-2810000	active	2025-10-19 21:57:31.025924	2025-10-19 21:57:31.025924
14	9	Central Bank of Kenya	Governor	CBK	Haile Selassie Avenue, Nairobi	https://www.centralbank.go.ke	communications@centralbank.go.ke	+254-20-2860000	active	2025-10-19 21:57:31.026654	2025-10-19 21:57:31.026654
15	9	Insurance Regulatory Authority	Godfrey Kiptum	IRA	Nairobi, Kenya	https://ira.go.ke	info@ira.go.ke	+254-20-4996000	active	2025-10-19 21:57:31.027336	2025-10-19 21:57:31.027336
16	9	Kenya Deposit Insurance Corporation	Mohamed Ahmed	KDIC	Nairobi, Kenya	https://kdic.go.ke	info@kdic.go.ke	+254-20-2218553	active	2025-10-19 21:57:31.027947	2025-10-19 21:57:31.027947
17	11	Kenya National Highways Authority	Director General	KeNHA	Blue Shield Towers, Nairobi	https://www.kenha.co.ke	dg@kenha.co.ke	+254-20-2738000	active	2025-10-19 21:57:31.028502	2025-10-19 21:57:31.028502
18	11	Kenya Urban Roads Authority	Director General	KURA	IKM Place, Nairobi	https://www.kura.go.ke	info@kura.go.ke	+254-20-2726028	active	2025-10-19 21:57:31.029133	2025-10-19 21:57:31.029133
19	11	Kenya Rural Roads Authority	Director General	KeRRA	Barabara Plaza, Nairobi	https://www.kerra.go.ke	info@kerra.go.ke	+254-20-2723100	active	2025-10-19 21:57:31.029707	2025-10-19 21:57:31.029707
20	12	Kenya Civil Aviation Authority	Emile Nguza Arao	KCAA	Nairobi, Kenya	https://kcaa.or.ke	info@kcaa.or.ke	+254-20-827470	active	2025-10-19 21:57:31.030272	2025-10-19 21:57:31.030272
21	12	Kenya Ports Authority	Managing Director	KPA	Mombasa	https://www.kpa.co.ke	info@kpa.co.ke	+254-41-2110999	active	2025-10-19 21:57:31.030894	2025-10-19 21:57:31.030894
22	12	Kenya Railways Corporation	Managing Director	KRC	Haile Selassie Avenue, Nairobi	https://www.krc.co.ke	info@krc.co.ke	+254-20-2219011	active	2025-10-19 21:57:31.031637	2025-10-19 21:57:31.031637
23	17	Kenya ICT Authority	Director General	ICTA	Telposta Towers, Nairobi	https://www.icta.go.ke	info@icta.go.ke	+254-20-2211960	active	2025-10-19 21:57:31.032412	2025-10-19 21:57:31.032412
24	17	Konza Technopolis Development Authority	Chief Executive Officer	KoTDA	Konza City, Machakos	https://www.konza.go.ke	info@konza.go.ke	+254-20-2106000	active	2025-10-19 21:57:31.033128	2025-10-19 21:57:31.033128
25	18	Agriculture and Food Authority	Director General	AFA	Kilimo House, Nairobi	https://www.afa.go.ke	info@afa.go.ke	+254-20-2718870	active	2025-10-19 21:57:31.033751	2025-10-19 21:57:31.033751
26	18	Kenya Agricultural and Livestock Research Organization	Director General	KALRO	Kaptagat Road, Nairobi	https://www.kalro.org	info@kalro.org	+254-20-3560555	active	2025-10-19 21:57:31.034407	2025-10-19 21:57:31.034407
27	18	National Cereals and Produce Board	Joseph Kimote	NCPB	Nairobi, Kenya	https://ncpb.co.ke	info@ncpb.co.ke	+254-20-3933000	active	2025-10-19 21:57:31.035014	2025-10-19 21:57:31.035014
28	19	Kenya Veterinary Board	Registrar	KVB	Veterinary Research Labs, Nairobi	https://www.kvb.go.ke	info@kvb.go.ke	+254-20-3533169	active	2025-10-19 21:57:31.035578	2025-10-19 21:57:31.035578
29	19	Kenya Meat Commission	Managing Commissioner	KMC	Athi River, Machakos	https://www.kmc.co.ke	info@kmc.co.ke	+254-45-6622001	active	2025-10-19 21:57:31.036205	2025-10-19 21:57:31.036205
30	8	Higher Education Loans Board	Charles Ringera	HELB	Anniversary Towers, Nairobi	https://www.helb.co.ke	contactcentre@helb.co.ke	+254711052000	active	2025-10-19 21:57:31.036851	2025-10-19 21:57:31.036851
31	8	Commission for University Education	Commission Secretary	CUE	Redhill Road, Nairobi	https://www.cue.or.ke	info@cue.or.ke	+254-20-7205000	active	2025-10-19 21:57:31.037533	2025-10-19 21:57:31.037533
32	6	Teachers Service Commission	Chief Executive Officer	TSC	Upper Hill, Nairobi	https://www.tsc.go.ke	info@tsc.go.ke	+254-20-2892000	active	2025-10-19 21:57:31.038229	2025-10-19 21:57:31.038229
33	6	Kenya National Examinations Council	Dr. David Njengere	KNEC	Nairobi, Kenya	https://knec.ac.ke	info@knec.ac.ke	+254-20-2713874	active	2025-10-19 21:57:31.038825	2025-10-19 21:57:31.038825
\.


--
-- Data for Name: agenda; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agenda (id, meeting_id, memo_id, name, ministry_id, presenter_id, sort_order, description, status, cabinet_approval_required, created_at, updated_at, created_by) FROM stdin;
9	1	\N	Hi-Vis Reflector A8	\N	\N	1		draft	f	2025-11-10 16:01:31.09932	2025-11-10 16:01:31.09932	\N
10	19	\N	Prayers	\N	\N	1		draft	f	2025-11-10 16:03:42.55292	2025-11-10 16:03:42.55292	\N
11	19	\N	Opening Remarks	\N	\N	2		draft	f	2025-11-10 16:03:55.638011	2025-11-10 16:03:55.638011	\N
12	19	\N	Agenda 1	\N	\N	3		draft	f	2025-11-10 16:05:02.192119	2025-11-10 16:05:02.192119	\N
13	19	\N	Agenda 2	\N	\N	4		draft	f	2025-11-10 16:15:15.975807	2025-11-10 16:15:15.975807	\N
14	19	\N	AOB	\N	\N	5		draft	f	2025-11-10 16:15:25.022071	2025-11-10 16:15:25.022071	\N
24	16	\N	hi	\N	\N	9		draft	f	2025-11-12 16:45:01.902264	2025-11-12 16:45:01.902264	\N
25	16	\N	Max	\N	\N	10		draft	f	2025-11-12 20:15:49.654	2025-11-12 20:15:49.654	\N
26	20	\N	good morning	13	31	1		draft	f	2025-11-13 12:53:47.781519	2025-11-13 12:54:09.269852	\N
27	16	\N	AOB	\N	\N	11		draft	f	2025-11-13 15:06:21.084246	2025-11-13 15:06:21.084246	\N
28	16	\N	hi	\N	\N	3		draft	f	2025-11-13 16:13:14.47643	2025-11-13 16:13:14.47643	\N
29	21	\N	Prayers	\N	\N	1		draft	f	2025-11-13 16:35:10.666382	2025-11-13 16:35:10.666382	\N
30	21	\N	Opening Remarks	\N	\N	2		draft	f	2025-11-13 16:35:29.609971	2025-11-13 16:35:29.609971	\N
31	16	\N	Agenda 6	\N	\N	13		draft	f	2025-11-13 16:39:03.867316	2025-11-13 16:39:03.867316	\N
32	16	\N	Noma	\N	\N	14		draft	f	2025-11-13 19:39:27.623286	2025-11-13 19:39:27.623286	\N
5	14	\N	Opening Remarks	15	315	1	Session introduction and welcome by Chair	draft	f	2025-11-09 13:45:59.23921	2025-11-10 18:50:50.346292	1
8	14	\N	Closing Remarks	\N	33	4	Final wrap-up and resolutions by Chair	draft	f	2025-11-09 13:45:59.23921	2025-11-10 18:51:03.063865	1
15	16	\N	Prayers	23	\N	1	meeting started at exactly 9am with prayers	confirmed	f	2025-11-10 16:31:42.711412	2025-11-13 19:56:20.216591	\N
16	16	\N	Edward Kibet	\N	\N	1		approved	f	2025-11-10 16:31:55.816092	2025-11-13 19:59:51.823853	\N
17	16	\N	Agenda 1	13	3	3		submitted	f	2025-11-10 16:32:02.106407	2025-11-10 20:05:52.810838	\N
20	16	\N	Agenda 5	9	315	6		draft	f	2025-11-11 23:47:12.875557	2025-11-11 23:47:52.228709	\N
21	16	\N	Closing Prayers	\N	2	7		draft	f	2025-11-11 23:47:22.600475	2025-11-12 00:20:37.923738	\N
1	1	\N	Opening Remarks	\N	\N	1	Session introduction and welcome by Chair	draft	f	2025-11-09 13:45:56.236988	2025-11-12 15:40:47.552743	1
6	1	\N	Infrastructure Development Proposal	\N	\N	2	Comprehensive infrastructure development plan...	draft	t	2025-11-09 13:45:59.23921	2025-11-12 15:40:53.39223	1
2	1	\N	Infrastructure Development Proposal	\N	\N	2	Comprehensive infrastructure development plan...	draft	t	2025-11-09 13:45:56.236988	2025-11-12 15:40:57.790432	1
7	1	\N	Energy Sector Updates	\N	\N	3	Strategy for renewable energy investments...	draft	f	2025-11-09 13:45:59.23921	2025-11-12 15:41:02.751339	1
3	1	\N	Energy Sector Updates	\N	\N	3	Strategy for renewable energy investments...	draft	f	2025-11-09 13:45:56.236988	2025-11-12 15:41:06.61573	1
4	1	\N	Closing Remarks	\N	\N	4	Final wrap-up and resolutions by Chair	draft	f	2025-11-09 13:45:56.236988	2025-11-12 15:41:10.105063	1
23	2	\N	Opening Remarks	\N	1	1		draft	f	2025-11-12 15:43:12.732883	2025-11-12 15:43:33.378444	\N
22	16	\N	hi	10	\N	8		draft	f	2025-11-12 14:58:21.71004	2025-11-13 20:03:47.344296	\N
18	16	\N	Dennis Kibett	\N	\N	1		confirmed	f	2025-11-10 16:46:17.771428	2025-11-13 21:48:37.381227	\N
19	16	\N	Agenda 4	4	13	5		draft	f	2025-11-10 17:02:18.493219	2025-11-13 21:50:18.548878	\N
34	15	\N	Prayers	\N	\N	2		draft	f	2025-11-14 11:24:13.654708	2025-11-14 11:24:13.654708	\N
33	15	\N	Agenda 1	\N	\N	2		draft	f	2025-11-14 11:17:12.777976	2025-11-14 11:28:52.457944	\N
35	22	\N	Prayers	\N	\N	1		draft	f	2025-11-14 11:33:27.859976	2025-11-14 11:33:27.859976	\N
36	22	\N	Opening Remarks	\N	\N	2		draft	f	2025-11-14 11:33:34.058606	2025-11-14 11:33:34.058606	\N
37	22	\N	Agenda 1	20	41	3		draft	f	2025-11-14 11:33:38.761226	2025-11-14 11:34:35.30354	\N
\.


--
-- Data for Name: agenda_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agenda_documents (id, agenda_id, name, created_at, file_type, file_url, file_size, uploaded_at, metadata, uploaded_by) FROM stdin;
1	17	1pU9bhJ1n7D1pOchC8HX3sjPjyQvqQYROnL8cGZe.jpg	2025-11-10 20:05:44.041677	image	/uploads/agenda_documents/1762794344037-szocdsf33u-1pU9bhJ1n7D1pOchC8HX3sjPjyQvqQYROnL8cGZe.jpg	16874	2025-11-10 20:05:44.041677+03	{"mimeType": "image/jpeg", "uploadedAt": "2025-11-10T17:05:44.040Z", "uploadedBy": "William Kabogo Gitau", "originalName": "1pU9bhJ1n7D1pOchC8HX3sjPjyQvqQYROnL8cGZe.jpg", "fileExtension": "jpg"}	11
2	17	KENYA ELECTRONIC CABINET MEETING MANAGEMENT SYSTEM.docx	2025-11-10 22:28:56.342875	word	/uploads/agenda_documents/1762802936338-jmikp2nwaq9-KENYA_ELECTRONIC_CABINET_MEETING_MANAGEMENT_SYSTEM.docx	21396	2025-11-10 22:28:56.342875+03	{"mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploadedAt": "2025-11-10T19:28:56.342Z", "uploadedBy": "William Kabogo Gitau", "originalName": "KENYA ELECTRONIC CABINET MEETING MANAGEMENT SYSTEM.docx", "fileExtension": "docx"}	11
3	17	Gov Bot .pdf	2025-11-11 16:13:55.138072	pdf	/uploads/agenda_documents/1762866835128-2rlaipm7xhe-Gov_Bot_.pdf	1766032	2025-11-11 16:13:55.138072+03	{"mimeType": "application/pdf", "uploadedAt": "2025-11-11T13:13:55.137Z", "uploadedBy": "William Kabogo Gitau", "originalName": "Gov Bot .pdf", "fileExtension": "pdf"}	11
4	17	Harlequins Court Residence Security Collections - UPDATED LIST.csv	2025-11-11 16:15:00.218942	other	/uploads/agenda_documents/1762866900201-ztxfwaqc79-Harlequins_Court_Residence_Security_Collections_-_UPDATED_LIST.csv	12270	2025-11-11 16:15:00.218942+03	{"mimeType": "text/csv", "uploadedAt": "2025-11-11T13:15:00.218Z", "uploadedBy": "William Kabogo Gitau", "originalName": "Harlequins Court Residence Security Collections - UPDATED LIST.csv", "fileExtension": "csv"}	11
5	16	EPERA Visitor & Gate Management System Proposal.pdf	2025-11-11 19:01:30.179279	pdf	/uploads/agenda_documents/1762876890171-er2cjjf3uvk-EPERA_Visitor___Gate_Management_System_Proposal.pdf	136988	2025-11-11 19:01:30.179279+03	{"mimeType": "application/pdf", "uploadedAt": "2025-11-11T16:01:30.178Z", "uploadedBy": "William Kabogo Gitau", "originalName": "EPERA Visitor & Gate Management System Proposal.pdf", "fileExtension": "pdf"}	11
6	19	Contribution_of_Immigration_and_Citizen_Services_to_DPI_Kenya.pptx	2025-11-11 22:04:28.384818	powerpoint	/uploads/agenda_documents/1762887868372-ihoa4yy8ht9-Contribution_of_Immigration_and_Citizen_Services_to_DPI_Kenya.pptx	30186	2025-11-11 22:04:28.384818+03	{"mimeType": "application/vnd.openxmlformats-officedocument.presentationml.presentation", "uploadedAt": "2025-11-11T19:04:28.384Z", "uploadedBy": "William Kabogo Gitau", "originalName": "Contribution_of_Immigration_and_Citizen_Services_to_DPI_Kenya.pptx", "fileExtension": "pptx"}	11
7	19	Business Operation Manual.docx	2025-11-11 22:10:40.779224	word	/uploads/agenda_documents/1762888240775-kxss7umr6dp-Business_Operation_Manual.docx	23854	2025-11-11 22:10:40.779224+03	{"mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploadedAt": "2025-11-11T19:10:40.778Z", "uploadedBy": "William Kabogo Gitau", "originalName": "Business Operation Manual.docx", "fileExtension": "docx"}	11
8	23	Meeting Mgt.docx	2025-11-12 15:51:29.590956	word	/uploads/agenda_documents/1762951889547-n2f48hh71kh-Meeting_Mgt.docx	8606572	2025-11-12 15:51:29.590956+03	{"mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploadedAt": "2025-11-12T12:51:29.590Z", "uploadedBy": "William Kabogo Gitau", "originalName": "Meeting Mgt.docx", "fileExtension": "docx"}	11
9	23	KENYA ELECTRONIC CABINET MEETING MANAGEMENT SYSTEM.docx	2025-11-12 15:53:00.857317	word	/uploads/agenda_documents/1762951980851-6tvxfmfz44v-KENYA_ELECTRONIC_CABINET_MEETING_MANAGEMENT_SYSTEM.docx	21396	2025-11-12 15:53:00.857317+03	{"mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploadedAt": "2025-11-12T12:53:00.854Z", "uploadedBy": "William Kabogo Gitau", "originalName": "KENYA ELECTRONIC CABINET MEETING MANAGEMENT SYSTEM.docx", "fileExtension": "docx"}	11
10	26	KENYA ELECTRONIC CABINET MEETING MANAGEMENT SYSTEM.docx	2025-11-13 12:54:04.463409	word	/uploads/agenda_documents/1763027644459-3zcc9seeun2-KENYA_ELECTRONIC_CABINET_MEETING_MANAGEMENT_SYSTEM.docx	21396	2025-11-13 12:54:04.463409+03	{"mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploadedAt": "2025-11-13T09:54:04.463Z", "uploadedBy": "H.E. Dr. William Samoei Ruto, C.G.H", "originalName": "KENYA ELECTRONIC CABINET MEETING MANAGEMENT SYSTEM.docx", "fileExtension": "docx"}	1
11	16	Integrated_Investment_Loan_System_Proposal.docx	2025-11-13 19:57:58.610829	word	/uploads/agenda_documents/1763053078600-x8g3z87ewzl-Integrated_Investment_Loan_System_Proposal.docx	38866	2025-11-13 19:57:58.610829+03	{"mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploadedAt": "2025-11-13T16:57:58.609Z", "uploadedBy": "H.E. Dr. William Samoei Ruto, C.G.H", "originalName": "Integrated_Investment_Loan_System_Proposal.docx", "fileExtension": "docx"}	1
12	33	Meeting Mgt.docx	2025-11-14 11:18:43.153385	word	/uploads/agenda_documents/1763108323110-j72ttp1rnl-Meeting_Mgt.docx	8606572	2025-11-14 11:18:43.153385+03	{"mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploadedAt": "2025-11-14T08:18:43.152Z", "uploadedBy": "H.E. Dr. William Samoei Ruto, C.G.H", "originalName": "Meeting Mgt.docx", "fileExtension": "docx"}	1
13	33	1pU9bhJ1n7D1pOchC8HX3sjPjyQvqQYROnL8cGZe.jpg	2025-11-14 11:28:26.663151	image	/uploads/agenda_documents/1763108906658-z95roc0wx6f-1pU9bhJ1n7D1pOchC8HX3sjPjyQvqQYROnL8cGZe.jpg	16874	2025-11-14 11:28:26.663151+03	{"mimeType": "image/jpeg", "uploadedAt": "2025-11-14T08:28:26.662Z", "uploadedBy": "H.E. Dr. William Samoei Ruto, C.G.H", "originalName": "1pU9bhJ1n7D1pOchC8HX3sjPjyQvqQYROnL8cGZe.jpg", "fileExtension": "jpg"}	1
14	33	Jambojet.com - Itinerary.pdf	2025-11-14 11:28:38.548384	pdf	/uploads/agenda_documents/1763108918512-xeejbq6d1tr-Jambojet.com_-_Itinerary.pdf	361760	2025-11-14 11:28:38.548384+03	{"mimeType": "application/pdf", "uploadedAt": "2025-11-14T08:28:38.530Z", "uploadedBy": "H.E. Dr. William Samoei Ruto, C.G.H", "originalName": "Jambojet.com - Itinerary.pdf", "fileExtension": "pdf"}	1
15	37	Receipt_TK433995KP.pdf	2025-11-14 11:34:24.715428	pdf	/uploads/agenda_documents/1763109264703-6excjkvagqv-Receipt_TK433995KP.pdf	225479	2025-11-14 11:34:24.715428+03	{"mimeType": "application/pdf", "uploadedAt": "2025-11-14T08:34:24.714Z", "uploadedBy": "H.E. Dr. William Samoei Ruto, C.G.H", "originalName": "Receipt_TK433995KP.pdf", "fileExtension": "pdf"}	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, target_type, target_id, metadata, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: cabinet_committees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cabinet_committees (id, name, cluster_id, chair_title, description, status, created_at, updated_at) FROM stdin;
1	Cabinet Committee on Governance and Security	1	Deputy President	Oversees governance, justice and security matters	active	2025-10-18 20:08:36.779688	2025-10-18 20:08:36.779688
2	Cabinet Committee on Economic Affairs	2	Deputy President	Oversees economic planning and development	active	2025-10-18 20:08:36.78186	2025-10-18 20:08:36.78186
3	Cabinet Committee on Infrastructure	3	Deputy President	Oversees infrastructure development projects	active	2025-10-18 20:08:36.782532	2025-10-18 20:08:36.782532
4	Cabinet Committee on Social Services	4	Deputy President	Oversees social services and welfare programs	active	2025-10-18 20:08:36.783249	2025-10-18 20:08:36.783249
5	Cabinet Committee on Production and Manufacturing	5	Deputy President	Oversees production and manufacturing sectors	active	2025-10-18 20:08:36.783976	2025-10-18 20:08:36.783976
6	Cabinet Committee on Environment and Natural Resources	6	Deputy President	Oversees environment and natural resources management	active	2025-10-18 20:08:36.784742	2025-10-18 20:08:36.784742
7	Full Cabinet	\N	President	Full cabinet meeting chaired by the President	active	2025-10-18 20:08:36.78531	2025-10-18 20:08:36.78531
\.


--
-- Data for Name: cabinet_releases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cabinet_releases (id, meeting_id, document_id, title, content, release_type, published_by, published_at, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.categories (id, name, type, icon, colour, created_at, updated_at) FROM stdin;
1	State House, Nairobi	location	Building	#0057b7	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
2	State House, Mombasa	location	Building	#0077cc	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
3	State House, Nakuru	location	Building	#4e73df	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
4	State House, Kisumu	location	Building	#36b9cc	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
5	State House, Eldoret	location	Building	#1cc88a	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
6	State Lodge, Sagana	location	MapPin	#20c997	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
7	State Lodge, Kisii	location	MapPin	#17a2b8	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
8	State Lodge, Kakamega	location	MapPin	#6f42c1	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
9	State Lodge, Mtito Andei	location	MapPin	#6610f2	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
10	State Lodge, Eldoret	location	MapPin	#6610f2	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
11	State Lodge, Nakuru	location	MapPin	#6f42c1	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
12	State Lodge, Kisumu	location	MapPin	#007bff	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
13	State Lodge, Mombasa	location	MapPin	#009688	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
14	Office of the President	location	Building2	#4e73df	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
15	Office of the Deputy President	location	Building2	#17a2b8	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
16	Office of the Prime Cabinet Secretary	location	Building2	#6c757d	2025-11-06 00:32:15.937454	2025-11-06 00:32:15.937454
17	Scheduled	meeting_status	Clock	#36b9cc	2025-11-06 00:32:29.537307	2025-11-06 00:32:29.537307
18	Ongoing	meeting_status	Loader2	#f6c23e	2025-11-06 00:32:29.537307	2025-11-06 00:32:29.537307
19	Completed	meeting_status	CheckCircle	#1cc88a	2025-11-06 00:32:29.537307	2025-11-06 00:32:29.537307
20	Postponed	meeting_status	PauseCircle	#858796	2025-11-06 00:32:29.537307	2025-11-06 00:32:29.537307
21	Cancelled	meeting_status	XCircle	#e74a3b	2025-11-06 00:32:29.537307	2025-11-06 00:32:29.537307
22	Approved	meeting_status	BadgeCheck	#20c997	2025-11-06 00:32:29.537307	2025-11-06 00:32:29.537307
23	Pending Approval	meeting_status	AlertCircle	#fd7e14	2025-11-06 00:32:29.537307	2025-11-06 00:32:29.537307
24	Active	user_status	UserCheck	#1cc88a	2025-11-06 00:32:35.482548	2025-11-06 00:32:35.482548
25	Inactive	user_status	UserX	#e74a3b	2025-11-06 00:32:35.482548	2025-11-06 00:32:35.482548
26	Suspended	user_status	ShieldX	#ff6f61	2025-11-06 00:32:35.482548	2025-11-06 00:32:35.482548
27	Pending Verification	user_status	ShieldAlert	#f6c23e	2025-11-06 00:32:35.482548	2025-11-06 00:32:35.482548
28	Deactivated	user_status	UserMinus	#858796	2025-11-06 00:32:35.482548	2025-11-06 00:32:35.482548
29	Deleted	user_status	Trash2	#dc3545	2025-11-06 00:32:35.482548	2025-11-06 00:32:35.482548
30	Regular Agenda	agenda_type	ClipboardList	#0d6efd	2025-11-06 00:36:16.237844	2025-11-06 00:36:16.237844
31	Cabinet Meeting Agenda	agenda_type	Briefcase	#6610f2	2025-11-06 00:36:16.237844	2025-11-06 00:36:16.237844
32	Special Agenda	agenda_type	Star	#6f42c1	2025-11-06 00:36:16.237844	2025-11-06 00:36:16.237844
33	Technical Committee Agenda	agenda_type	Wrench	#20c997	2025-11-06 00:36:16.237844	2025-11-06 00:36:16.237844
34	Emergency Agenda	agenda_type	AlertTriangle	#dc3545	2025-11-06 00:36:16.237844	2025-11-06 00:36:16.237844
35	Draft Minutes	minutes_type	FileEdit	#ffc107	2025-11-06 00:36:24.218897	2025-11-06 00:36:24.218897
36	Confirmed Minutes	minutes_type	FileCheck	#198754	2025-11-06 00:36:24.218897	2025-11-06 00:36:24.218897
37	Reviewed Minutes	minutes_type	FileSearch	#0dcaf0	2025-11-06 00:36:24.218897	2025-11-06 00:36:24.218897
38	Adopted Minutes	minutes_type	BookCheck	#4e73df	2025-11-06 00:36:24.218897	2025-11-06 00:36:24.218897
39	Archived Minutes	minutes_type	Archive	#6c757d	2025-11-06 00:36:24.218897	2025-11-06 00:36:24.218897
40	Policy Memo	gov_memo_type	ScrollText	#0d6efd	2025-11-06 00:36:31.072817	2025-11-06 00:36:31.072817
41	Implementation Memo	gov_memo_type	Hammer	#20c997	2025-11-06 00:36:31.072817	2025-11-06 00:36:31.072817
42	Budget Memo	gov_memo_type	Wallet	#198754	2025-11-06 00:36:31.072817	2025-11-06 00:36:31.072817
43	Communication Memo	gov_memo_type	Megaphone	#6610f2	2025-11-06 00:36:31.072817	2025-11-06 00:36:31.072817
44	Confidential Memo	gov_memo_type	Lock	#dc3545	2025-11-06 00:36:31.072817	2025-11-06 00:36:31.072817
45	Draft	decision_status	FileEdit	#ffc107	2025-11-06 00:36:40.162142	2025-11-06 00:36:40.162142
46	Submitted	decision_status	Upload	#0dcaf0	2025-11-06 00:36:40.162142	2025-11-06 00:36:40.162142
47	Reviewed	decision_status	Eye	#6610f2	2025-11-06 00:36:40.162142	2025-11-06 00:36:40.162142
48	Approved	decision_status	CheckCircle2	#198754	2025-11-06 00:36:40.162142	2025-11-06 00:36:40.162142
49	Rejected	decision_status	XCircle	#dc3545	2025-11-06 00:36:40.162142	2025-11-06 00:36:40.162142
50	Implemented	decision_status	CheckSquare	#0d6efd	2025-11-06 00:36:40.162142	2025-11-06 00:36:40.162142
51	Archived	decision_status	Archive	#6c757d	2025-11-06 00:36:40.162142	2025-11-06 00:36:40.162142
52	Draft	action_letter_status	FileEdit	#ffc107	2025-11-06 00:36:46.243818	2025-11-06 00:36:46.243818
53	Issued	action_letter_status	Send	#0dcaf0	2025-11-06 00:36:46.243818	2025-11-06 00:36:46.243818
54	Acknowledged	action_letter_status	MailCheck	#198754	2025-11-06 00:36:46.243818	2025-11-06 00:36:46.243818
55	In Progress	action_letter_status	Loader2	#20c997	2025-11-06 00:36:46.243818	2025-11-06 00:36:46.243818
56	Completed	action_letter_status	CheckCircle	#0d6efd	2025-11-06 00:36:46.243818	2025-11-06 00:36:46.243818
57	Delayed	action_letter_status	ClockAlert	#fd7e14	2025-11-06 00:36:46.243818	2025-11-06 00:36:46.243818
58	Closed	action_letter_status	Archive	#6c757d	2025-11-06 00:36:46.243818	2025-11-06 00:36:46.243818
59	Cabinet Committee	committee_type	Users2	#0d6efd	2025-11-06 00:36:52.785605	2025-11-06 00:36:52.785605
60	Sub-Committee	committee_type	UserCog	#6610f2	2025-11-06 00:36:52.785605	2025-11-06 00:36:52.785605
61	Ad Hoc Committee	committee_type	UserSearch	#20c997	2025-11-06 00:36:52.785605	2025-11-06 00:36:52.785605
62	Standing Committee	committee_type	UserCheck	#198754	2025-11-06 00:36:52.785605	2025-11-06 00:36:52.785605
63	Technical Working Group	committee_type	Wrench	#6f42c1	2025-11-06 00:36:52.785605	2025-11-06 00:36:52.785605
64	Secretariat	committee_type	BriefcaseBusiness	#0dcaf0	2025-11-06 00:36:52.785605	2025-11-06 00:36:52.785605
65	Taskforce	committee_type	ClipboardList	#fd7e14	2025-11-06 00:36:52.785605	2025-11-06 00:36:52.785605
66	Attending	rsvp_status	CheckCircle2	#198754	2025-11-06 00:41:09.660539	2025-11-06 00:41:09.660539
67	Not Attending	rsvp_status	XCircle	#dc3545	2025-11-06 00:41:09.660539	2025-11-06 00:41:09.660539
68	Tentative	rsvp_status	Clock	#fd7e14	2025-11-06 00:41:09.660539	2025-11-06 00:41:09.660539
69	No Response	rsvp_status	HelpCircle	#6c757d	2025-11-06 00:41:09.660539	2025-11-06 00:41:09.660539
70	Declined	rsvp_status	UserX	#ff6f61	2025-11-06 00:41:09.660539	2025-11-06 00:41:09.660539
71	Mandatory	participation_status	UserCheck	#0d6efd	2025-11-06 00:41:22.499911	2025-11-06 00:41:22.499911
72	Optional	participation_status	User	#20c997	2025-11-06 00:41:22.499911	2025-11-06 00:41:22.499911
73	Observer	participation_status	Eye	#6f42c1	2025-11-06 00:41:22.499911	2025-11-06 00:41:22.499911
74	Invitee	participation_status	UserPlus	#6610f2	2025-11-06 00:41:22.499911	2025-11-06 00:41:22.499911
75	Apology Sent	participation_status	MailX	#dc3545	2025-11-06 00:41:22.499911	2025-11-06 00:41:22.499911
76	Cabinet	meeting	Users	#0d6efd	2025-11-06 09:33:10.927799	2025-11-06 09:33:10.927799
77	Committee	meeting	Users	#6610f2	2025-11-06 09:33:10.927799	2025-11-06 09:33:10.927799
78	Blue	colour		#3b82f6	2025-11-06 14:32:51.992139	2025-11-06 14:32:51.992139
79	Red	colour		#ef4444	2025-11-06 14:32:51.992139	2025-11-06 14:32:51.992139
80	Green	colour		#10b981	2025-11-06 14:32:51.992139	2025-11-06 14:32:51.992139
81	Yellow	colour		#f59e0b	2025-11-06 14:32:51.992139	2025-11-06 14:32:51.992139
82	Purple	colour		#8b5cf6	2025-11-06 14:32:51.992139	2025-11-06 14:32:51.992139
83	Cyan	colour		#06b6d4	2025-11-06 14:32:51.992139	2025-11-06 14:32:51.992139
84	Orange	colour		#f97316	2025-11-06 14:32:51.992139	2025-11-06 14:32:51.992139
85	Lime	colour		#84cc16	2025-11-06 14:32:51.992139	2025-11-06 14:32:51.992139
86	Meetings	resource_type	\N	\N	2025-11-14 14:23:09.60387	2025-11-14 14:23:09.60387
87	Decision Letters	resource_type	\N	\N	2025-11-14 14:23:09.60387	2025-11-14 14:23:09.60387
88	Minutes	resource_type	\N	\N	2025-11-14 14:23:09.60387	2025-11-14 14:23:09.60387
89	Government Memo	resource_type	\N	\N	2025-11-14 14:23:09.60387	2025-11-14 14:23:09.60387
90	Committee Report	resource_type	\N	\N	2025-11-14 14:23:09.60387	2025-11-14 14:23:09.60387
\.


--
-- Data for Name: clusters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clusters (id, name, description, chair_ministry_id, created_at, updated_at) FROM stdin;
1	Governance, Justice & Law & Order	Governance and legal affairs cluster	\N	2025-10-18 20:08:36.745813	2025-10-18 20:08:36.745813
2	Economic Affairs	Economic development and planning cluster	\N	2025-10-18 20:08:36.747973	2025-10-18 20:08:36.747973
3	Infrastructure	Infrastructure development cluster	\N	2025-10-18 20:08:36.748315	2025-10-18 20:08:36.748315
4	Social Services	Social services and welfare cluster	\N	2025-10-18 20:08:36.748658	2025-10-18 20:08:36.748658
5	Production & Manufacturing	Production and manufacturing cluster	\N	2025-10-18 20:08:36.748977	2025-10-18 20:08:36.748977
6	Environment & Natural Resources	Environment and natural resources cluster	\N	2025-10-18 20:08:36.749318	2025-10-18 20:08:36.749318
7	Regional Development	Regional development and integration cluster	\N	2025-10-18 20:08:36.74962	2025-10-18 20:08:36.74962
\.


--
-- Data for Name: deliberations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deliberations (id, agenda_id, discussion_summary, recommendations, decision_type, decision_text, requires_president_signature, signed_by, signed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, name, file_name, file_path, file_size, mime_type, document_type, status, access_level, uploaded_by, created_at, updated_at, gov_memo_id) FROM stdin;
\.


--
-- Data for Name: gov_memos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gov_memos (id, name, summary, body, memo_type, ministry_id, priority, status, created_by, submitted_at, created_at, updated_at, state_department_id, agency_id, updated_by) FROM stdin;
1	Digital Transformation in Public Service Delivery	Proposal to digitize key government services to enhance efficiency, transparency, and accessibility for citizens across all counties.	The Ministry proposes a phased rollout of digital government platforms under eCitizen to integrate service delivery...	cabinet	3	high	submitted	4	2025-10-20 13:12:13.335206	2025-10-20 13:12:13.335206	2025-10-20 13:12:13.335206	\N	\N	\N
2	National Green Energy Transition Plan	A framework for Kenya’s transition to 100% renewable energy by 2035, focusing on solar, wind, and geothermal projects.	The Ministry of Energy and Petroleum recommends policy alignment with Vision 2030 and the Paris Climate Agreement...	committee	3	urgent	under_review	45	2025-10-20 13:12:13.394914	2025-10-20 13:12:13.394914	2025-10-20 13:12:13.394914	\N	\N	\N
3	Infrastructure Partnership with Private Sector	Proposal for PPP framework to fund road construction and maintenance of critical infrastructure corridors.	The Ministry of Roads and Transport proposes collaboration with the private sector through concession models...	decision	3	high	approved	47	2025-10-20 13:12:13.400291	2025-10-20 13:12:13.400291	2025-10-20 13:12:13.400291	\N	\N	\N
4	National Infrastructure Development Plan 2025	Proposal outlining the infrastructure priorities for FY 2025 including road expansion and urban transport upgrades.	This memo presents the planned infrastructure initiatives focusing on rural connectivity, urban mass transit systems, and sustainable public works.	cabinet	19	high	draft	38	2025-10-20 13:22:16.155107	2025-10-20 13:22:16.155107	2025-10-20 13:22:16.155107	\N	\N	\N
5	Youth Empowerment through Digital Skills Program	Framework for implementing a nationwide digital skills training program for youth and unemployed graduates.	The memo seeks Cabinet approval to roll out a digital skills initiative in partnership with the private sector, targeting 200,000 youth.	committee	3	medium	submitted	47	2025-10-20 13:22:16.160381	2025-10-20 13:22:16.160381	2025-10-20 13:22:16.160381	\N	\N	\N
6	Health Sector Preparedness and Emergency Response Plan	Comprehensive framework for improving emergency healthcare response capacity in all 47 counties.	The Ministry of Health requests funding and logistical support for expanding emergency care and disease surveillance networks.	cabinet	15	urgent	under_review	12	2025-10-20 13:22:16.161192	2025-10-20 13:22:16.161192	2025-10-20 13:22:16.161192	\N	\N	\N
7	Affordable Housing Project Implementation Update	Progress report and funding request for the ongoing affordable housing initiative across major urban centers.	The memo outlines key milestones achieved and challenges in the rollout of affordable housing projects, proposing additional funding support.	information	7	medium	approved	40	2025-10-20 13:22:16.161839	2025-10-20 13:22:16.161839	2025-10-20 13:22:16.161839	\N	\N	\N
12	Agricultural Inputs and Resource Allocation:	Agricultural Inputs and Resource Allocation: Instructions for the efficient distribution of high-yield and climate-resilient seed varieties, fertilizers, and pesticides. It may also emphasize the promotion of organic and eco-friendly inputs. 	Agricultural Inputs and Resource Allocation: Instructions for the efficient distribution of high-yield and climate-resilient seed varieties, fertilizers, and pesticides. It may also emphasize the promotion of organic and eco-friendly inputs. \nExtension Services and Farmer Training: A directive to scale up farmer education programs, focusing on modern farming techniques, pest management, and knowledge exchange, such as training extension workers. \nInfrastructure Development: A mandate to invest in critical rural infrastructure, such as storage facilities, cold chains, improved transportation networks, and water harvesting and irrigation systems. \nPolicy and Regulatory Framework: A call to review land use policies and strengthen agricultural laws and standards to ensure compliance and sustainability. 	cabinet	19	medium	draft	30	\N	2025-10-20 19:48:29.075852	2025-10-20 19:48:29.075852	18	\N	30
13	Failed to fetch memos: 405 Method Not Allowed	Failed to fetch memos: 405 Method Not Allowed\n\n	Failed to fetch memos: 405 Method Not Allowed\n\n	cabinet	2	urgent	draft	30	\N	2025-10-20 19:55:49.388985	2025-10-20 19:55:49.388985	3	\N	\N
14	eBoard System	 for SH	 for SH	cabinet	2	high	draft	30	\N	2025-10-20 20:55:28.108955	2025-10-20 20:55:28.108955	3	\N	\N
15	eBoard System	 for SH	 for SH	cabinet	2	urgent	draft	6	\N	2025-10-20 20:58:05.977113	2025-10-20 20:58:05.977113	3	\N	\N
16	30 Reflectors	gfjhfgj	hgkgkhgkj	cabinet	19	high	draft	6	\N	2025-10-22 11:59:48.902654	2025-10-22 11:59:48.902654	18	\N	\N
17	Director Kimaile Briefing	Discuss eboard system	Discuss eboard system	interior	2	urgent	draft	1	\N	2025-10-22 16:18:23.806436	2025-10-22 16:18:23.806436	3	\N	\N
18	Edward Kibet	jkhghghj	hjgjhghjgjh	cabinet	9	medium	draft	11	\N	2025-10-24 12:27:27.389411	2025-10-24 12:27:27.389411	23	\N	11
19	Edward Kibet	lkjm	vhjg	cabinet	9	medium	draft	1	\N	2025-10-24 14:18:29.526633	2025-10-24 14:18:29.526633	24	\N	1
20	Max Memo	ghfhgfghf	ghfghfghfhg	cabinet	2	medium	draft	1	\N	2025-10-31 14:52:37.098184	2025-10-31 14:52:37.098184	3	\N	1
21	boardms Agenda	Meeting to go through the boardms system	Meeting to go through the boardms systemMeeting to go through the boardms systemMeeting to go through the boardms systemMeeting to go through the boardms systemMeeting to go through the boardms systemMeeting to go through the boardms systemMeeting to go through the boardms systemMeeting to go through the boardms system	cabinet	2	urgent	draft	11	\N	2025-11-07 12:29:49.852274	2025-11-07 12:29:49.852274	3	\N	11
\.


--
-- Data for Name: group_users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.group_users (id, group_id, user_id, mandatory_id) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.groups (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: meeting_minutes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meeting_minutes (id, meeting_id, document_id, prepared_by, approved_by, approved_at, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: meeting_participants; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.meeting_participants (id, meeting_id, user_id, group_id, created_at, rsvp_id) FROM stdin;
1	16	1	\N	2025-11-12 01:04:03.111048	\N
2	16	2	\N	2025-11-12 01:04:03.137019	\N
3	16	12	\N	2025-11-12 01:04:03.138793	\N
4	16	32	\N	2025-11-12 01:04:03.141269	\N
5	16	31	\N	2025-11-12 01:04:03.14291	\N
6	16	38	\N	2025-11-12 01:04:03.153018	\N
7	16	42	\N	2025-11-12 01:06:12.162146	\N
8	16	33	\N	2025-11-12 01:06:12.178489	\N
9	16	315	\N	2025-11-12 01:06:12.181266	\N
10	16	39	\N	2025-11-12 01:06:12.183019	\N
11	16	34	\N	2025-11-12 01:06:26.172118	\N
12	16	7	\N	2025-11-12 01:06:26.177643	\N
13	16	9	\N	2025-11-12 01:06:26.179912	\N
14	16	41	\N	2025-11-12 01:07:12.582405	\N
15	16	14	\N	2025-11-12 01:07:12.585286	\N
16	16	44	\N	2025-11-12 01:10:02.11363	\N
17	16	40	\N	2025-11-12 01:10:02.144562	\N
18	16	11	\N	2025-11-12 12:16:42.49356	\N
19	1	2	\N	2025-11-12 15:17:56.444037	\N
20	1	12	\N	2025-11-12 15:17:56.457456	\N
21	1	32	\N	2025-11-12 15:17:56.460006	\N
22	2	1	\N	2025-11-12 15:42:33.574938	\N
23	2	2	\N	2025-11-12 15:42:33.586764	\N
24	2	12	\N	2025-11-12 15:42:33.589297	\N
25	2	32	\N	2025-11-12 15:42:33.591088	\N
26	16	43	\N	2025-11-12 20:15:03.262728	\N
27	16	37	\N	2025-11-12 20:15:08.6071	\N
28	20	1	\N	2025-11-13 12:52:56.732536	\N
29	20	2	\N	2025-11-13 12:52:56.739216	\N
30	20	12	\N	2025-11-13 12:52:56.743153	\N
31	20	32	\N	2025-11-13 12:52:56.74894	\N
32	20	31	\N	2025-11-13 12:52:56.75379	\N
33	20	38	\N	2025-11-13 12:52:56.755852	\N
34	20	42	\N	2025-11-13 12:52:56.757942	\N
35	21	2	\N	2025-11-13 16:34:30.165574	\N
36	21	12	\N	2025-11-13 16:34:30.183046	\N
37	21	32	\N	2025-11-13 16:34:30.204684	\N
38	21	31	\N	2025-11-13 16:34:30.209676	\N
39	21	30	\N	2025-11-13 16:34:30.217079	\N
40	15	2	\N	2025-11-14 11:22:43.661516	\N
41	15	12	\N	2025-11-14 11:22:43.724385	\N
42	15	33	\N	2025-11-14 11:22:43.750712	\N
43	15	42	\N	2025-11-14 11:22:43.757666	\N
44	15	34	\N	2025-11-14 11:22:43.764414	\N
45	15	41	\N	2025-11-14 11:22:43.773906	\N
46	15	14	\N	2025-11-14 11:22:43.794675	\N
47	15	44	\N	2025-11-14 11:22:43.798973	\N
48	15	43	\N	2025-11-14 11:22:43.807114	\N
49	15	13	\N	2025-11-14 11:22:43.81385	\N
50	15	37	\N	2025-11-14 11:22:43.846859	\N
51	22	1	\N	2025-11-14 11:33:06.20708	\N
52	22	2	\N	2025-11-14 11:33:06.249273	\N
53	22	12	\N	2025-11-14 11:33:06.254167	\N
54	22	32	\N	2025-11-14 11:33:06.294436	\N
55	22	38	\N	2025-11-14 11:33:06.302909	\N
56	22	34	\N	2025-11-14 11:33:06.30645	\N
57	22	41	\N	2025-11-14 11:33:06.311049	\N
58	22	39	\N	2025-11-14 11:33:06.317647	\N
59	22	44	\N	2025-11-14 11:33:06.346357	\N
60	22	40	\N	2025-11-14 11:33:06.351928	\N
61	22	11	\N	2025-11-14 11:33:06.356839	\N
62	22	37	\N	2025-11-14 11:33:06.360464	\N
63	22	30	\N	2025-11-14 11:33:06.365577	\N
64	22	47	\N	2025-11-14 11:33:06.377586	\N
65	22	45	\N	2025-11-14 11:33:06.402554	\N
66	22	46	\N	2025-11-14 11:33:06.409793	\N
\.


--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meetings (id, name, type, start_at, location, chair_id, status, created_at, updated_at, approved_by, created_by, description, period, actual_end, colour) FROM stdin;
2	Full Cabinet Meeting - March 2024	Cabinet	2025-03-20 10:00:00	State House, Nairobi	1	scheduled	2025-10-18 20:08:36.789303	2025-10-18 20:08:36.789303	\N	\N	\N	45	\N	\N
4	Full Cabinet Meeting - March 2024	Cabinet	2024-03-20 10:00:00	State House, Nairobi	1	scheduled	2025-10-18 20:09:38.970612	2025-10-18 20:09:38.970612	\N	\N	\N	75	\N	\N
6	Full Cabinet Meeting - March 2024	Cabinet	2024-03-20 10:00:00	State House, Nairobi	1	scheduled	2025-10-18 20:10:31.825895	2025-10-18 20:10:31.825895	\N	\N	\N	105	\N	\N
8	Full Cabinet Meeting - March 2024	Cabinet	2024-03-20 10:00:00	State House, Nairobi	1	scheduled	2025-10-19 21:27:34.217799	2025-10-19 21:27:34.217799	\N	\N	\N	135	\N	\N
10	Full Cabinet Meeting - March 2024	Cabinet	2024-03-20 10:00:00	State House, Nairobi	1	scheduled	2025-10-19 21:29:14.734234	2025-10-19 21:29:14.734234	\N	\N	\N	165	\N	\N
12	Full Cabinet Meeting - March 2024	Cabinet	2024-11-20 10:00:00	State House, Nairobi	1	scheduled	2025-10-19 21:40:39.443911	2025-10-19 21:40:39.443911	\N	\N	\N	195	\N	\N
19	6th Full Cabinet Meeting	Cabinet	2025-11-28 03:00:00	State House, Nairobi	1	Scheduled	2025-11-09 18:31:36.996892	2025-11-12 11:22:54.027336	\N	1	Full cabinet meeting	120	2025-11-28 11:00:00	#f59e0b
18	Full Cabinet Meeting - March 2024	Cabinet	2024-03-20 10:00:00	State House, Nairobi	1	scheduled	2025-10-19 21:57:31.117098	2025-10-19 21:57:31.117098	\N	\N	\N	300	\N	\N
20	hi	Cabinet	2025-12-05 12:00:00	Office of the Deputy President	1	Scheduled	2025-11-13 12:52:24.819651	2025-11-13 12:52:24.819651	\N	1		60	2025-12-05 19:00:00	#10b981
3	Cabinet Committee on Governance and Security - Q1 2024	Committee	2024-03-15 09:00:00	State House, Nairobi	2	scheduled	2025-10-18 20:09:38.96893	2025-10-18 20:09:38.96893	\N	\N	\N	60	\N	\N
5	Cabinet Committee on Governance and Security - Q1 2024	Committee	2024-03-15 09:00:00	State House, Nairobi	2	scheduled	2025-10-18 20:10:31.823405	2025-10-18 20:10:31.823405	\N	\N	\N	90	\N	\N
7	Cabinet Committee on Governance and Security - Q1 2024	Committee	2024-03-15 09:00:00	State House, Nairobi	2	scheduled	2025-10-19 21:27:34.208271	2025-10-19 21:27:34.208271	\N	\N	\N	120	\N	\N
9	Cabinet Committee on Governance and Security - Q1 2024	Committee	2024-03-15 09:00:00	State House, Nairobi	2	scheduled	2025-10-19 21:29:14.73181	2025-10-19 21:29:14.73181	\N	\N	\N	150	\N	\N
11	Cabinet Committee on Governance and Security - Q1 2024	Committee	2024-03-15 09:00:00	State House, Nairobi	2	scheduled	2025-10-19 21:40:39.441296	2025-10-19 21:40:39.441296	\N	\N	\N	180	\N	\N
17	Cabinet Committee on Governance and Security - Q1 2024	Committee	2024-03-15 09:00:00	State House, Nairobi	2	scheduled	2025-10-19 21:57:31.116062	2025-10-19 21:57:31.116062	\N	\N	\N	270	\N	\N
15	Cabinet Committee on Governance and Security - Q1 2025	Committee	2025-11-16 03:00:00	State House, Nairobi	2	scheduled	2025-10-19 21:51:02.504194	2025-11-09 23:02:16.495392	\N	\N		240	2025-11-16 13:00:00	#f59e0b
13	Cabinet Committee on Governance and Security - Q1 2025	Committee	2025-11-12 21:00:00	State House, Nairobi	2	Scheduled	2025-10-19 21:43:41.244326	2025-11-10 00:19:02.257969	\N	\N		2100	2025-11-14 14:00:00	#8b5cf6
1	Governance and Security - Q1 2025	Committee	2025-11-20 21:00:00	State House, Nairobi	2	scheduled	2025-10-18 20:08:36.786348	2025-11-10 00:20:33.320657	\N	\N		30	2025-11-21 03:30:00	#f97316
14	Full Cabinet Meeting - March 2024	Cabinet	2025-11-06 19:00:00	State House, Nairobi	1	scheduled	2025-10-19 21:43:41.246264	2025-11-10 00:21:06.765439	\N	\N		225	2025-11-07 04:45:00	#ef4444
21	Updates on the boardms System	Committee	2025-11-13 02:59:00	State Lodge, Sagana	2	Ongoing	2025-11-13 16:29:27.103934	2025-11-13 16:32:13.161671	\N	1		60	2025-11-13 09:59:00	#3b82f6
16	Full Cabinet Meeting - March 2025	Cabinet	2025-11-14 01:00:00	State House, Nairobi	1	Approved	2025-10-19 21:51:02.507257	2025-11-13 16:36:13.865008	\N	\N		2550	2025-11-16 01:30:00	#8b5cf6
22	Eunice Awuor Feedback meeting	Cabinet	2025-11-14 12:00:00	State Lodge, Sagana	1	Completed	2025-11-14 11:32:11.725648	2025-11-14 11:32:11.725648	\N	1		30	2025-11-14 18:30:00	#84cc16
\.


--
-- Data for Name: memo_affected_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.memo_affected_entities (id, memo_id, ministry_id, state_department_id, agency_id, entity_type, created_at) FROM stdin;
\.


--
-- Data for Name: memo_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.memo_documents (id, memo_id, document_id, created_at) FROM stdin;
\.


--
-- Data for Name: ministries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ministries (id, name, acronym, cluster_id, cabinet_secretary, headquarters, website, email, phone, status, created_at, updated_at) FROM stdin;
3	Ministry of Foreign and Diaspora Affairs	Foreign Affairs	1	3	Old Treasury Building, Nairobi	https://www.foreignaffairs.go.ke	info@foreignaffairs.go.ke	+254-20-3318888	active	2025-10-19 21:33:55.496996	2025-10-19 21:33:55.496996
15	Ministry of Education	Education	4	9	Jogoo House, Nairobi	https://www.education.go.ke	info@education.go.ke	+254-20-3318581	active	2025-10-19 21:33:55.508993	2025-10-19 21:33:55.508993
21	Ministry of Environment, Climate Change and Forestry	Environment	6	42	NHIF Building, Nairobi	https://www.environment.go.ke	info@environment.go.ke	+254-20-2731571	active	2025-10-19 21:33:55.513916	2025-10-19 21:33:55.513916
11	Ministry of Lands, Housing and Urban Development	Lands	3	32	Ardhi House, Nairobi	https://www.lands.go.ke	info@lands.go.ke	+254-20-2718050	active	2025-10-19 21:33:55.504139	2025-10-19 21:33:55.504139
8	Ministry of Investment, Trade and Industry	Investment	2	14	Co-operative Bank House, Nairobi	https://www.investment.go.ke	info@investment.go.ke	+254-20-3318888	active	2025-10-19 21:33:55.501734	2025-10-19 21:33:55.501734
17	Ministry of Labour and Social Protection	Labour	4	38	Social Security House, Nairobi	https://www.labour.go.ke	info@labour.go.ke	+254-20-2729800	active	2025-10-19 21:33:55.51054	2025-10-19 21:33:55.51054
13	Ministry of Energy and Petroleum	Energy	3	34	Nyayo House, Nairobi	https://www.energy.go.ke	info@energy.go.ke	+254-20-3101120	active	2025-10-19 21:33:55.506868	2025-10-19 21:33:55.506868
20	Ministry of Mining, Blue Economy and Maritime Affairs	Mining	5	41	Ministry of Mining, Nairobi	https://www.mining.go.ke	info@mining.go.ke	+254-20-2723101	active	2025-10-19 21:33:55.51297	2025-10-19 21:33:55.51297
16	Ministry of Youth Affairs, Creative Economy and Sports	Youth	4	37	Kencom House, Nairobi	https://www.youth.go.ke	info@youth.go.ke	+254-20-2210941	active	2025-10-19 21:33:55.509741	2025-10-19 21:33:55.509741
19	Ministry of Agriculture and Livestock Development	Agriculture	5	40	Kilimo House, Nairobi	https://www.agriculture.go.ke	info@kilimo.go.ke	+254-20-2718870	active	2025-10-19 21:33:55.512094	2025-10-19 21:33:55.512094
14	Ministry of Health	Health	4	12	Afya House, Nairobi	https://www.health.go.ke	info@health.go.ke	+254-20-2717077	active	2025-10-19 21:33:55.508204	2025-10-19 21:33:55.508204
2	Ministry of Interior and National Administration	Interior	1	47	Harambee House, Nairobi	https://www.interior.go.ke	info@interior.go.ke	+254-20-2227411	active	2025-10-19 21:33:55.496057	2025-10-19 21:33:55.496057
4	Ministry of Defence	Defence	1	13	Defence Headquarters, Nairobi	https://www.mod.go.ke	info@mod.go.ke	+254-20-2726000	active	2025-10-19 21:33:55.498105	2025-10-19 21:33:55.498105
7	Ministry of Information, Communication and the Digital Economy	ICT	2	11	Telposta Towers, Nairobi	https://www.ict.go.ke	info@ict.go.ke	+254-20-2089061	active	2025-10-19 21:33:55.500731	2025-10-19 21:33:55.500731
9	Ministry of Cooperatives and MSME Development	Cooperatives	2	30	Co-operative Bank House, Nairobi	https://www.cooperatives.go.ke	info@cooperatives.go.ke	+254-20-2712801	active	2025-10-19 21:33:55.502579	2025-10-19 21:33:55.502579
6	The National Treasury and Economic Planning	Treasury	2	7	Treasury Building, Nairobi	https://www.treasury.go.ke	info@treasury.go.ke	+254-20-2252300	active	2025-10-19 21:33:55.499877	2025-10-19 21:33:55.499877
12	Ministry of Water, Sanitation and Irrigation	Water	3	33	Majestic House, Nairobi	https://www.water.go.ke	info@water.go.ke	+254-20-2716103	active	2025-10-19 21:33:55.50499	2025-10-19 21:33:55.50499
10	Ministry of Roads and Transport	Transport	3	31	Transcom House, Nairobi	https://www.transport.go.ke	info@transport.go.ke	+254-20-2729200	active	2025-10-19 21:33:55.50338	2025-10-19 21:33:55.50338
18	Ministry of Gender, Culture, The Arts and Heritage	Gender	4	39	National Museums of Kenya, Nairobi	https://www.gender.go.ke	info@gender.go.ke	+254-20-3742161	active	2025-10-19 21:33:55.511297	2025-10-19 21:33:55.511297
1	The Office of the Attorney-General and Department of Justice	AG	1	5	Sheria House, Nairobi	https://www.statelaw.go.ke	info@attorneygeneral.go.ke	+254-20-2222222	active	2025-10-19 21:33:55.489689	2025-10-19 21:33:55.489689
23	Ministry of East African Community, ASALs and Regional Development	EAC	7	44	Jogoo House, Nairobi	https://www.eac.go.ke	info@eac.go.ke	+254-20-3318888	active	2025-10-19 21:33:55.519198	2025-10-19 21:33:55.519198
22	Ministry of Tourism and Wildlife	Tourism	6	43	Utalii House, Nairobi	https://www.tourism.go.ke	info@tourism.go.ke	+254-20-2711322	active	2025-10-19 21:33:55.516868	2025-10-19 21:33:55.516868
5	Ministry of Public Service and Human Capital Development	Public Service	1	315	NSSF Building, Nairobi	https://www.publicservice.go.ke	info@publicservice.go.ke	+254-20-2227460	active	2025-10-19 21:33:55.498915	2025-10-19 21:33:55.498915
\.


--
-- Data for Name: presidential_signatures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.presidential_signatures (id, document_id, signed_by, signed_at, signature_type, reference_id, reference_type, created_at) FROM stdin;
\.


--
-- Data for Name: resource_files; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.resource_files (id, resource_id, name, display_name, file_type, file_url, file_size, ministry_id, uploaded_by, uploaded_at, metadata, created_at) FROM stdin;
1	1	MINISTRY_OF_COOPERATIVES_AND_MSME_DEVELOPMENT_KENYA_ELECTRONIC_CABINET_MEETING_MANAGEMENT_SYSTEM.docx	KENYA ELECTRONIC CABINET MEETING MANAGEMENT SYSTEM	word	/uploads/resources/Meetings/2025/6TH-CABINET-MEETING-2025/1763120775156-r35rq2mrds.docx	21396	9	1	2025-11-14 14:46:15.159288	{"year": 2025, "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploadedAt": "2025-11-14T11:46:15.158Z", "ministryName": "Ministry of Cooperatives and MSME Development", "originalName": "KENYA ELECTRONIC CABINET MEETING MANAGEMENT SYSTEM.docx", "resourceName": "6TH-CABINET-MEETING-2025", "resourceType": "Meetings", "uniqueFileName": "1763120775156-r35rq2mrds.docx", "folderStructure": "resources/Meetings/2025/6TH-CABINET-MEETING-2025/"}	2025-11-14 14:46:15.159288
2	1	MINISTRY_OF_ENERGY_AND_PETROLEUM_MEETING_MGT.docx	Meeting Mgt	word	/uploads/resources/Meetings/2025/6TH-CABINET-MEETING-2025/1763120790499-f4xgny2f2ph.docx	8606572	13	1	2025-11-14 14:46:30.529974	{"year": 2025, "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploadedAt": "2025-11-14T11:46:30.529Z", "ministryName": "Ministry of Energy and Petroleum", "originalName": "Meeting Mgt.docx", "resourceName": "6TH-CABINET-MEETING-2025", "resourceType": "Meetings", "uniqueFileName": "1763120790499-f4xgny2f2ph.docx", "folderStructure": "resources/Meetings/2025/6TH-CABINET-MEETING-2025/"}	2025-11-14 14:46:30.529974
3	2	MINISTRY_OF_ENVIRONMENT__CLIMATE_CHANGE_AND_FORESTRY_KENYA_ELECTRONIC_CABINET_MEETING_MANAGEMENT_SYSTEM.docx	KENYA ELECTRONIC CABINET MEETING MANAGEMENT SYSTEM	word	/uploads/resources/Government Memo/2025/GOV-MEMO-202501/1763121763557-sf4srnd00c.docx	21396	21	1	2025-11-14 15:02:43.559997	{"year": 2025, "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "uploadedAt": "2025-11-14T12:02:43.559Z", "ministryName": "Ministry of Environment, Climate Change and Forestry", "originalName": "KENYA ELECTRONIC CABINET MEETING MANAGEMENT SYSTEM.docx", "resourceName": "GOV-MEMO-202501", "resourceType": "Government Memo", "uniqueFileName": "1763121763557-sf4srnd00c.docx", "folderStructure": "resources/Government Memo/2025/GOV-MEMO-202501/"}	2025-11-14 15:02:43.559997
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.resources (id, name, display_name, resource_type_id, year, description, metadata, created_by, created_at, updated_at) FROM stdin;
1	6TH-CABINET-MEETING-2025	6TH CABINET MEETING 2025	86	2025		\N	1	2025-11-14 14:40:08.089508	2025-11-14 14:40:08.089508
2	GOV-MEMO-202501	GOV MEMO 2025/01	89	2025		\N	1	2025-11-14 15:02:14.289798	2025-11-14 15:02:14.289798
\.


--
-- Data for Name: state_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.state_departments (id, ministry_id, name, principal_secretary, location, website, email, phone, status, created_at, updated_at, ps) FROM stdin;
1	2	State Department for Internal Security and National Administration	\N	Harambee House, Nairobi	interior.go.ke	psinternalsecurity@interior.go.ke	+254-20-2227411	active	2025-10-19 21:57:30.974401	2025-10-19 21:57:30.974401	Dr. Raymond Omollo
2	2	State Department for Correctional Services	\N	Harambee House, Nairobi	interior.go.ke	pscorrectional@interior.go.ke	+254-20-2227412	active	2025-10-19 21:57:30.980007	2025-10-19 21:57:30.980007	Ms. Salome Wairimu Muhia-Beacco
3	2	State Department for Immigration and Citizen Services	\N	Nyayo House, Nairobi	immigration.go.ke	psimmigration@immigration.go.ke	+254-20-2222021	active	2025-10-19 21:57:30.980841	2025-10-19 21:57:30.980841	Prof. Julius Bitok
4	14	State Department for Medical Services	\N	Afya House, Nairobi	health.go.ke	psmedicalservices@health.go.ke	+254-20-2717077	active	2025-10-19 21:57:30.982081	2025-10-19 21:57:30.982081	Ms. Mary Muthoni Muriuki
5	14	State Department for Public Health and Professional Standards	\N	Afya House, Nairobi	health.go.ke	pspublichealth@health.go.ke	+254-20-2717078	active	2025-10-19 21:57:30.982846	2025-10-19 21:57:30.982846	Dr. Mary Muthoni Muriuki
6	15	State Department for Basic Education	\N	Jogoo House, Nairobi	education.go.ke	psbasiceducation@education.go.ke	+254-20-3318581	active	2025-10-19 21:57:30.98369	2025-10-19 21:57:30.98369	Dr. Belio Kipsang
7	15	State Department for Technical, Vocational Education & Training	\N	Jogoo House, Nairobi	education.go.ke	pstvet@education.go.ke	+254-20-3318582	active	2025-10-19 21:57:30.984505	2025-10-19 21:57:30.984505	Dr. Esther Mworia
8	15	State Department for Higher Education and Research	\N	Jogoo House, Nairobi	education.go.ke	pshighereducation@education.go.ke	+254-20-3318583	active	2025-10-19 21:57:30.985238	2025-10-19 21:57:30.985238	Dr. Beatrice Inyangala
9	6	State Department for National Treasury	\N	Treasury Building, Nairobi	treasury.go.ke	ps@treasury.go.ke	+254-20-2252300	active	2025-10-19 21:57:30.985927	2025-10-19 21:57:30.985927	Dr. Chris Kiptoo
10	6	State Department for Economic Planning	\N	Treasury Building, Nairobi	treasury.go.ke	planning@treasury.go.ke	+254-20-2252301	active	2025-10-19 21:57:30.986535	2025-10-19 21:57:30.986535	Mr. James Muhati
11	10	State Department for Roads	\N	Transcom House, Nairobi	transport.go.ke	psroads@transport.go.ke	+254-20-2729200	active	2025-10-19 21:57:30.987168	2025-10-19 21:57:30.987168	Eng. Joseph M. Mbugua
12	10	State Department for Transport	\N	Transcom House, Nairobi	transport.go.ke	pstransport@transport.go.ke	+254-20-2729300	active	2025-10-19 21:57:30.987914	2025-10-19 21:57:30.987914	Mr. Mohamed Daghar
13	11	State Department for Lands and Physical Planning	\N	Ardhi House, Nairobi	lands.go.ke	pslands@lands.go.ke	+254-20-2718050	active	2025-10-19 21:57:30.988632	2025-10-19 21:57:30.988632	Mr. Nixon Korir
14	11	State Department for Housing and Urban Development	\N	Ardhi House, Nairobi	lands.go.ke	pshousing@lands.go.ke	+254-20-2718051	active	2025-10-19 21:57:30.98928	2025-10-19 21:57:30.98928	Mr. Charles Hinga Mwaura
15	11	State Department for Public Works	\N	Ardhi House, Nairobi	publicworks.go.ke	pspublicworks@publicworks.go.ke	+254-20-2718052	active	2025-10-19 21:57:30.989885	2025-10-19 21:57:30.989885	Prof. Joel K. M. Mburu
16	7	State Department for Broadcasting and Telecommunications	\N	Telposta Towers, Nairobi	ict.go.ke	psbroadcasting@ict.go.ke	+254-20-2089061	active	2025-10-19 21:57:30.990539	2025-10-19 21:57:30.990539	Prof. Edward Kisiang'ani
17	7	State Department for ICT and the Digital Economy	\N	Telposta Towers, Nairobi	ict.go.ke	psict@ict.go.ke	+254-20-2089062	active	2025-10-19 21:57:30.991308	2025-10-19 21:57:30.991308	Eng. John Tanui
18	19	State Department for Agriculture	\N	Kilimo House, Nairobi	kilimo.go.ke	psagriculture@kilimo.go.ke	+254-20-2718870	active	2025-10-19 21:57:30.99196	2025-10-19 21:57:30.99196	Dr. Paul Ronoh
19	19	State Department for Livestock Development	\N	Kilimo House, Nairobi	kilimo.go.ke	pslivestock@kilimo.go.ke	+254-20-2718871	active	2025-10-19 21:57:30.992641	2025-10-19 21:57:30.992641	Mr. Jonathan Mueke
20	8	State Department for Investment Promotion	\N	Co-operative Bank House, Nairobi	investment.go.ke	psinvestment@investment.go.ke	+254-20-3318889	active	2025-10-19 21:57:30.993403	2025-10-19 21:57:30.993403	Mr. Abubakar Hassan
21	8	State Department for Trade	\N	Co-operative Bank House, Nairobi	trade.go.ke	pstrade@trade.go.ke	+254-20-3318890	active	2025-10-19 21:57:30.994368	2025-10-19 21:57:30.994368	Mr. Alfred K'Ombudo
22	8	State Department for Industry	\N	Co-operative Bank House, Nairobi	trade.go.ke	psindustry@trade.go.ke	+254-20-3318891	active	2025-10-19 21:57:30.99533	2025-10-19 21:57:30.99533	Dr. Juma Mukhwana
23	9	State Department for Cooperatives	\N	Co-operative Bank House, Nairobi	cooperatives.go.ke	pscooperatives@cooperatives.go.ke	+254-20-2712801	active	2025-10-19 21:57:30.996096	2025-10-19 21:57:30.996096	Mr. Patrick Kilemi
24	9	State Department for MSME Development	\N	Co-operative Bank House, Nairobi	cooperatives.go.ke	psmsme@cooperatives.go.ke	+254-20-2712802	active	2025-10-19 21:57:30.996712	2025-10-19 21:57:30.996712	Ms. Susan Mang'eni
25	16	State Department for Youth Affairs and Creative Economy	\N	Kencom House, Nairobi	youth.go.ke	psyouth@youth.go.ke	+254-20-2210941	active	2025-10-19 21:57:30.997356	2025-10-19 21:57:30.997356	Mr. Ismail Maalim Madey
26	16	State Department for Sports	\N	Kencom House, Nairobi	youth.go.ke	pssports@youth.go.ke	+254-20-2210942	active	2025-10-19 21:57:30.997981	2025-10-19 21:57:30.997981	Eng. Peter Tum
27	21	State Department for Environment and Climate Change	\N	NHIF Building, Nairobi	environment.go.ke	psenvironment@environment.go.ke	+254-20-2731571	active	2025-10-19 21:57:30.998582	2025-10-19 21:57:30.998582	Eng. Festus Ngeno
28	21	State Department for Forestry	\N	NHIF Building, Nairobi	environment.go.ke	psforestry@environment.go.ke	+254-20-2731572	active	2025-10-19 21:57:30.999231	2025-10-19 21:57:30.999231	Mr. Gitonga Mugambi
29	22	State Department for Tourism	\N	Utalii House, Nairobi	tourism.go.ke	pstourism@tourism.go.ke	+254-20-2711322	active	2025-10-19 21:57:30.99988	2025-10-19 21:57:30.99988	Mr. John Ololtuaa
30	22	State Department for Wildlife	\N	Utalii House, Nairobi	tourism.go.ke	pswildlife@tourism.go.ke	+254-20-2711323	active	2025-10-19 21:57:31.000515	2025-10-19 21:57:31.000515	Ms. Silvia Museiya Kihoro
31	12	State Department for Water and Sanitation	\N	Majestic House, Nairobi	water.go.ke	pswater@water.go.ke	+254-20-2716103	active	2025-10-19 21:57:31.001145	2025-10-19 21:57:31.001145	Dr. Julius Korir
32	12	State Department for Irrigation	\N	Majestic House, Nairobi	water.go.ke	psirrigation@water.go.ke	+254-20-2716104	active	2025-10-19 21:57:31.001808	2025-10-19 21:57:31.001808	Eng. Ephantus Kimani
33	13	State Department for Energy	\N	Nyayo House, Nairobi	energy.go.ke	psenergy@energy.go.ke	+254-20-3101120	active	2025-10-19 21:57:31.002471	2025-10-19 21:57:31.002471	Mr. Alex Wachira
34	13	State Department for Petroleum	\N	Nyayo House, Nairobi	energy.go.ke	pspetroleum@energy.go.ke	+254-20-3101121	active	2025-10-19 21:57:31.00311	2025-10-19 21:57:31.00311	Mr. Mohamed Liban
35	23	State Department for East African Community	\N	Jogoo House, Nairobi	eac.go.ke	pseac@eac.go.ke	+254-20-3318888	active	2025-10-19 21:57:31.003693	2025-10-19 21:57:31.003693	Ms. Joyce Mose
36	23	State Department for ASALs and Regional Development	\N	Jogoo House, Nairobi	devolution.go.ke	psasals@devolution.go.ke	+254-20-3318889	active	2025-10-19 21:57:31.004316	2025-10-19 21:57:31.004316	Mr. Idris Dokota
37	20	State Department for Mining	\N	Ministry of Mining, Nairobi	mining.go.ke	psmining@mining.go.ke	+254-20-2723101	active	2025-10-19 21:57:31.004963	2025-10-19 21:57:31.004963	Mr. Elijah Mwangi
38	20	State Department for Blue Economy and Fisheries	\N	Ministry of Mining, Nairobi	fisheries.go.ke	psblueeconomy@fisheries.go.ke	+254-20-2723102	active	2025-10-19 21:57:31.005624	2025-10-19 21:57:31.005624	Dr. Francis Owino
39	20	State Department for Shipping and Maritime Affairs	\N	Ministry of Mining, Nairobi	maritime.go.ke	psshipping@maritime.go.ke	+254-20-2723103	active	2025-10-19 21:57:31.007583	2025-10-19 21:57:31.007583	Mr. Geoffrey Kaituko
40	17	State Department for Labour and Skills Development	\N	Social Security House, Nairobi	labour.go.ke	pslabour@labour.go.ke	+254-20-2729800	active	2025-10-19 21:57:31.008184	2025-10-19 21:57:31.008184	Mr. Shadrack Mwadime
41	17	State Department for Social Protection and Senior Citizen Affairs	\N	Social Security House, Nairobi	labour.go.ke	pssocialprotection@labour.go.ke	+254-20-2729801	active	2025-10-19 21:57:31.008829	2025-10-19 21:57:31.008829	Mr. Joseph Motari
42	5	State Department for Public Service	\N	NSSF Building, Nairobi	publicservice.go.ke	pspublicservice@publicservice.go.ke	+254-20-2227460	active	2025-10-19 21:57:31.009519	2025-10-19 21:57:31.009519	Mr. Amos Gathecha
43	5	State Department for Performance and Delivery Management	\N	Harambee House Annex, Nairobi	publicservice.go.ke	psperformance@publicservice.go.ke	+254-20-2227462	active	2025-10-19 21:57:31.010281	2025-10-19 21:57:31.010281	Ms. Veronica Nduva
44	18	State Department for Gender and Affirmative Action	\N	NSSF Building, Nairobi	publicservice.go.ke	psgender@publicservice.go.ke	+254-20-2227461	active	2025-10-19 21:57:31.011072	2025-10-19 21:57:31.011072	Ms. Veronica Nduva
45	18	State Department for Culture, the Arts and Heritage	\N	National Museums of Kenya, Nairobi	culture.go.ke	psculture@culture.go.ke	+254-20-3742161	active	2025-10-19 21:57:31.011752	2025-10-19 21:57:31.011752	Ms. Ummi Bashir
46	1	State Department for Justice	\N	Sheria House, Nairobi	stateLawOffice.go.ke	psjustice@stateLawOffice.go.ke	+254-20-2772000	active	2025-10-19 21:57:31.012348	2025-10-19 21:57:31.012348	Ms. Deborah K. Muthoni
47	3	State Department for Foreign Affairs	\N	Ministry of Foreign Affairs, Nairobi	foreignaffairs.go.ke	ps@foreignaffairs.go.ke	+254-20-3318888	active	2025-10-19 21:57:31.012962	2025-10-19 21:57:31.012962	Dr. Korir Sing'oei
48	3	State Department for Diaspora Affairs	\N	Ministry of Foreign Affairs, Nairobi	foreignaffairs.go.ke	diaspora@foreignaffairs.go.ke	+254-20-3318892	active	2025-10-19 21:57:31.013531	2025-10-19 21:57:31.013531	Ms. Roseline Njogu
49	4	State Department of Defence	\N	Defence Headquarters, Nairobi	defence.go.ke	ps@defence.go.ke	+254-20-2726000	active	2025-10-19 21:57:31.0141	2025-10-19 21:57:31.0141	Mr. Patrick Mariru
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.system_settings (id, name, version, timezone, date_format, language, email_notifications, push_notifications, meeting_reminders, deadline_alerts, weekly_reports, session_timeout, password_policy, two_factor_auth, ip_whitelist, audit_log_retention, smtp_enabled, smtp_server, smtp_port, file_storage, max_file_size, created_at, updated_at, logo, slogan) FROM stdin;
1	boardms System	2.0.2	Africa/Nairobi	DD/MM/YYYY	English	t	t	t	t	f	30	strong	f	{192.168.1.0/24}	365	t	smtp.gov.go.ke	587	local	10	2025-11-05 23:19:01.123+03	2025-11-07 11:36:32.47068+03	logo.svg	Government Decision Management Platform
\.


--
-- Data for Name: user_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_notes (id, user_id, agenda_id, note_type, content, annotation_image_path, page_number, coordinates, is_private, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, status, phone, last_login, created_at, updated_at, image) FROM stdin;
4	Cabinet Secretariat	secretariat@cabinet.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Cabinet Secretariat	active	\N	\N	2025-10-18 20:05:49.456668	2025-10-18 20:05:49.456668	\N
45	Dr. Raymond Omollo	omollo@interior.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Principal Secretary	inactive	\N	\N	2025-10-18 20:08:36.743854	2025-10-18 20:08:36.743854	\N
49	Assistant Director Cabinet	assistant.director@cabinet.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Assistant Director	pending	\N	\N	2025-10-18 20:08:36.745376	2025-10-18 20:08:36.745376	\N
5	Ms. Dorcas Agik Oduor SC, E.B.S., O.G.W.	info@attorneygeneral.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Attorney General	active	\N	\N	2025-10-18 20:05:49.488775	2025-10-20 12:42:29.434883	https://www.president.go.ke/wp-content/uploads/oduor-dorcas-profile.jpg
44	Ms. Beatrice Asukul Moe	info@eac.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	2025-10-19 21:07:32.801766	2025-10-18 20:08:36.743466	2025-10-20 12:43:07.417741	https://www.president.go.ke/wp-content/uploads/Beatrice-Askul-Profile.jpg
46	Ms. Mary Muthoni Muriuki	muriuki@health.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Principal Secretary	inactive	\N	\N	2025-10-18 20:08:36.744243	2025-10-20 00:23:23.300223	\N
48	Mercy Kiiru Wanjau	director.cabinet@cabinet.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Director	active	\N	\N	2025-10-18 20:08:36.74501	2025-10-20 12:43:52.671176	https://www.president.go.ke/wp-content/uploads/Wanjau.jpg
7	John Mbadi Ng’ongo, E.G.H.	ndungu@treasury.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Cabinet Secretary	active	\N	\N	2025-10-18 20:05:49.531267	2025-10-20 12:36:46.187128	https://www.president.go.ke/wp-content/uploads/John-Mbadi.png
9	Julius Migos Ogamba	migos@education.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Cabinet Secretary	active	\N	\N	2025-10-18 20:05:49.573707	2025-10-20 12:33:34.473066	https://www.president.go.ke/wp-content/uploads/Julius-Migosi.png
13	Roselinda Soipan Tuya, E.G.H.	info@mod.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Cabinet Secretary	active	\N	\N	2025-10-18 20:05:49.657677	2025-10-20 12:35:52.667974	https://www.president.go.ke/wp-content/uploads/Soipan-Tuya.jpg
315	Geoffrey Kiringa Ruku	info@publicservice.go.ke	$2b$10$vKI.NvWCI25vGY.Y4AsVaOeNCRNhhZUEmF2Mnae88Q8Jt1YabTV/i	Cabinet Secretary	active	\N	\N	2025-10-20 12:45:08.725265	2025-10-20 12:45:08.725265	https://www.president.go.ke/wp-content/uploads/RUKU.jpg
14	Lee Maiyani Kinyanjui	info@investment.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Cabinet Secretary	active	\N	2025-11-06 12:15:53.673823	2025-10-18 20:05:49.689673	2025-10-20 12:37:50.711031	https://www.president.go.ke/wp-content/uploads/1-2.jpg
47	Dr. Belio Kipsang	kipsang@education.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Principal Secretary	inactive	\N	\N	2025-10-18 20:08:36.74462	2025-10-22 12:02:20.446546	\N
31	Davis Chirchir, E.G.H	info@transport.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	2025-10-20 13:28:44.33036	2025-10-18 20:08:36.73816	2025-10-20 12:41:12.921993	https://www.president.go.ke/wp-content/uploads/Davis-Chirchir.png
2	H.E Prof. Kithure Kindiki	deputy.president@president.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Deputy President	active	\N	2025-10-20 12:26:14.237931	2025-10-18 20:05:49.414744	2025-10-20 12:27:57.780741	https://www.president.go.ke/wp-content/uploads/kindiki-400x400.jpg
30	Wycliffe Ambetsa Oparanya, FCPA, E.G.H	info@cooperatives.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	2025-10-20 17:47:46.951989	2025-10-18 20:08:36.737185	2025-10-20 12:36:22.982453	https://www.president.go.ke/wp-content/uploads/oparanya.png
11	William Kabogo Gitau	owalo@ict.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Cabinet Secretary	active	\N	2025-11-19 21:01:26.388362	2025-10-18 20:05:49.615597	2025-10-20 12:39:37.601791	https://www.president.go.ke/wp-content/uploads/3-2.jpg
3	H.E Dr. Musalia Mudavadi E.G.H.	mudavadi@primecabinet.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Prime Cabinet Secretary	active	\N	2025-11-06 11:49:26.039362	2025-10-18 20:05:49.446396	2025-10-20 12:31:19.460478	https://www.president.go.ke/wp-content/uploads/Mudavadi.jpg
1	H.E. Dr. William Samoei Ruto, C.G.H	president@president.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	President	active	\N	2025-11-19 21:18:38.161832	2025-10-18 20:05:49.371046	2025-10-20 12:28:25.024845	https://www.president.go.ke/wp-content/uploads/administration.jpg
6	Onesimus Kipchumba Murkomen	murkomen@interior.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Cabinet Secretary	active	\N	2025-10-30 12:03:09.024536	2025-10-18 20:05:49.499342	2025-10-20 12:40:26.467802	https://www.president.go.ke/wp-content/uploads/Mukomen-1.jpg
12	Aden Duale, E.G.H.	duale@health.go.ke	$2b$10$FFkp5ryENeF81s7aB9QyB.iqcjr5cEd/f3t8GBPEiYpk7fqSyj0yW	Cabinet Secretary	active	\N	\N	2025-10-18 20:05:49.636794	2025-10-20 12:30:40.715962	https://www.president.go.ke/wp-content/uploads/Aden-Duale.png
32	Alice Wahome, E.G.H.	info@lands.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	\N	2025-10-18 20:08:36.738586	2025-10-20 12:33:57.380222	https://www.president.go.ke/wp-content/uploads/alice-wahome.jpg
41	Hassan Ali Joho, E.G.H	info@mining.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	\N	2025-10-18 20:08:36.742089	2025-10-20 12:34:22.465865	https://www.president.go.ke/wp-content/uploads/Joho.png
33	Eric Muriithi Muuga	info@water.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	\N	2025-10-18 20:08:36.738985	2025-10-20 12:37:06.118724	https://www.president.go.ke/wp-content/uploads/Eric-Murithi.png
34	James Opiyo Wandayi, E.G.H	info@energy.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	2025-10-20 14:18:19.674968	2025-10-18 20:08:36.739374	2025-10-20 12:58:56.862519	https://www.president.go.ke/wp-content/uploads/Opiyo-Wandayi.png
37	Salim Mvurya	info@youth.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	\N	2025-10-18 20:08:36.740557	2025-10-20 12:35:23.782763	https://www.president.go.ke/wp-content/uploads/Salim-Mvurya-1.jpg
38	Dr. Alfred Mutua, E.G.H.	info@labour.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	\N	2025-10-18 20:08:36.740955	2025-10-20 12:34:05.434036	https://www.president.go.ke/wp-content/uploads/Alfred.jpg
39	Hanna Wendot Cheptumo	info@gender.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	\N	2025-10-18 20:08:36.741324	2025-10-20 12:41:54.857949	https://www.president.go.ke/wp-content/uploads/cheptumo.jpg
40	Mutahi Kagwe E.G.H.	info@kilimo.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	2025-10-19 20:28:48.755589	2025-10-18 20:08:36.741717	2025-10-20 12:38:52.479726	https://www.president.go.ke/wp-content/uploads/2-3.jpg
42	Dr. Deborah Mulongo Barasa	info@environment.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	\N	2025-10-18 20:08:36.742456	2025-10-20 12:37:30.011469	https://www.president.go.ke/wp-content/uploads/DR-DEBORAH-MLONGO-BARASA-HEALTH-CS.jpg
43	Rebecca Miano, E.G.H.	info@tourism.go.ke	$2b$10$YOEhXIqiJ1Bwdybw4YVVkugT9MyHFVXYIjUVi96et/Ep5zLZFhl3m	Cabinet Secretary	active	\N	\N	2025-10-18 20:08:36.742854	2025-10-20 12:44:29.573523	https://www.president.go.ke/wp-content/uploads/Rebecca-Miano.jpg
\.


--
-- Name: action_letters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.action_letters_id_seq', 1, false);


--
-- Name: agencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agencies_id_seq', 33, true);


--
-- Name: agenda_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agenda_documents_id_seq', 15, true);


--
-- Name: agenda_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agenda_id_seq', 37, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: cabinet_committees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cabinet_committees_id_seq', 63, true);


--
-- Name: cabinet_releases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cabinet_releases_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.categories_id_seq', 90, true);


--
-- Name: clusters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clusters_id_seq', 84, true);


--
-- Name: deliberations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.deliberations_id_seq', 1, false);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- Name: gov_memos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gov_memos_id_seq', 21, true);


--
-- Name: group_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.group_users_id_seq', 1, false);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.groups_id_seq', 1, false);


--
-- Name: meeting_minutes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meeting_minutes_id_seq', 1, false);


--
-- Name: meeting_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.meeting_participants_id_seq', 66, true);


--
-- Name: meetings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.meetings_id_seq', 22, true);


--
-- Name: memo_affected_entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.memo_affected_entities_id_seq', 1, false);


--
-- Name: memo_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.memo_documents_id_seq', 1, false);


--
-- Name: ministries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ministries_id_seq', 161, true);


--
-- Name: presidential_signatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.presidential_signatures_id_seq', 1, false);


--
-- Name: resource_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.resource_files_id_seq', 3, true);


--
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.resources_id_seq', 2, true);


--
-- Name: state_departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.state_departments_id_seq', 49, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 1, true);


--
-- Name: user_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_notes_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 315, true);


--
-- Name: action_letters action_letters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_letters
    ADD CONSTRAINT action_letters_pkey PRIMARY KEY (id);


--
-- Name: agencies agencies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_pkey PRIMARY KEY (id);


--
-- Name: agencies agencies_state_department_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_state_department_id_name_key UNIQUE (state_department_id, name);


--
-- Name: agenda_documents agenda_documents_agenda_id_document_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda_documents
    ADD CONSTRAINT agenda_documents_agenda_id_document_id_key UNIQUE (agenda_id, name);


--
-- Name: agenda_documents agenda_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda_documents
    ADD CONSTRAINT agenda_documents_pkey PRIMARY KEY (id);


--
-- Name: agenda agenda_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda
    ADD CONSTRAINT agenda_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: cabinet_committees cabinet_committees_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabinet_committees
    ADD CONSTRAINT cabinet_committees_name_key UNIQUE (name);


--
-- Name: cabinet_committees cabinet_committees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabinet_committees
    ADD CONSTRAINT cabinet_committees_pkey PRIMARY KEY (id);


--
-- Name: cabinet_releases cabinet_releases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabinet_releases
    ADD CONSTRAINT cabinet_releases_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: clusters clusters_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clusters
    ADD CONSTRAINT clusters_name_key UNIQUE (name);


--
-- Name: clusters clusters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clusters
    ADD CONSTRAINT clusters_pkey PRIMARY KEY (id);


--
-- Name: deliberations deliberations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliberations
    ADD CONSTRAINT deliberations_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: gov_memos gov_memos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_memos
    ADD CONSTRAINT gov_memos_pkey PRIMARY KEY (id);


--
-- Name: group_users group_users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT group_users_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: meeting_minutes meeting_minutes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_minutes
    ADD CONSTRAINT meeting_minutes_pkey PRIMARY KEY (id);


--
-- Name: meeting_participants meeting_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT meeting_participants_pkey PRIMARY KEY (id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: memo_affected_entities memo_affected_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_affected_entities
    ADD CONSTRAINT memo_affected_entities_pkey PRIMARY KEY (id);


--
-- Name: memo_documents memo_documents_memo_id_document_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_documents
    ADD CONSTRAINT memo_documents_memo_id_document_id_key UNIQUE (memo_id, document_id);


--
-- Name: memo_documents memo_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_documents
    ADD CONSTRAINT memo_documents_pkey PRIMARY KEY (id);


--
-- Name: ministries ministries_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ministries
    ADD CONSTRAINT ministries_name_key UNIQUE (name);


--
-- Name: ministries ministries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ministries
    ADD CONSTRAINT ministries_pkey PRIMARY KEY (id);


--
-- Name: presidential_signatures presidential_signatures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presidential_signatures
    ADD CONSTRAINT presidential_signatures_pkey PRIMARY KEY (id);


--
-- Name: resource_files resource_files_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_files
    ADD CONSTRAINT resource_files_pkey PRIMARY KEY (id);


--
-- Name: resources resources_name_year_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_name_year_key UNIQUE (name, year);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: state_departments state_departments_ministry_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_departments
    ADD CONSTRAINT state_departments_ministry_id_name_key UNIQUE (ministry_id, name);


--
-- Name: state_departments state_departments_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_departments
    ADD CONSTRAINT state_departments_name_unique UNIQUE (name);


--
-- Name: state_departments state_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_departments
    ADD CONSTRAINT state_departments_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: user_notes user_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notes
    ADD CONSTRAINT user_notes_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_action_letters_deliberation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_action_letters_deliberation_id ON public.action_letters USING btree (deliberation_id);


--
-- Name: idx_agenda_meeting_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agenda_meeting_id ON public.agenda USING btree (meeting_id);


--
-- Name: idx_agenda_memo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agenda_memo_id ON public.agenda USING btree (memo_id);


--
-- Name: idx_agenda_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agenda_status ON public.agenda USING btree (status);


--
-- Name: idx_deliberations_agenda_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deliberations_agenda_id ON public.deliberations USING btree (agenda_id);


--
-- Name: idx_documents_access_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_access_level ON public.documents USING btree (access_level);


--
-- Name: idx_gov_memos_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gov_memos_created_by ON public.gov_memos USING btree (created_by);


--
-- Name: idx_gov_memos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gov_memos_status ON public.gov_memos USING btree (status);


--
-- Name: idx_gov_memos_submitting_ministry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_gov_memos_submitting_ministry ON public.gov_memos USING btree (ministry_id);


--
-- Name: idx_meetings_scheduled_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_meetings_scheduled_at ON public.meetings USING btree (start_at);


--
-- Name: idx_system_settings_updated; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_system_settings_updated ON public.system_settings USING btree (updated_at);


--
-- Name: idx_user_notes_user_agenda; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_notes_user_agenda ON public.user_notes USING btree (user_id, agenda_id);


--
-- Name: users trigger_set_admin_status; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_set_admin_status BEFORE INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_admin_status();


--
-- Name: system_settings update_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: admin
--

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: action_letters action_letters_deliberation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_letters
    ADD CONSTRAINT action_letters_deliberation_id_fkey FOREIGN KEY (deliberation_id) REFERENCES public.deliberations(id) ON DELETE CASCADE;


--
-- Name: action_letters action_letters_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_letters
    ADD CONSTRAINT action_letters_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: action_letters action_letters_to_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.action_letters
    ADD CONSTRAINT action_letters_to_ministry_id_fkey FOREIGN KEY (to_ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: agencies agencies_state_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agencies
    ADD CONSTRAINT agencies_state_department_id_fkey FOREIGN KEY (state_department_id) REFERENCES public.state_departments(id) ON DELETE CASCADE;


--
-- Name: agenda_documents agenda_documents_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda_documents
    ADD CONSTRAINT agenda_documents_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.agenda(id) ON DELETE CASCADE;


--
-- Name: agenda_documents agenda_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda_documents
    ADD CONSTRAINT agenda_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: agenda agenda_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda
    ADD CONSTRAINT agenda_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: agenda agenda_memo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda
    ADD CONSTRAINT agenda_memo_id_fkey FOREIGN KEY (memo_id) REFERENCES public.gov_memos(id) ON DELETE CASCADE;


--
-- Name: agenda agenda_presenter_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agenda
    ADD CONSTRAINT agenda_presenter_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: cabinet_committees cabinet_committees_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabinet_committees
    ADD CONSTRAINT cabinet_committees_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES public.clusters(id) ON DELETE SET NULL;


--
-- Name: cabinet_releases cabinet_releases_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabinet_releases
    ADD CONSTRAINT cabinet_releases_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: cabinet_releases cabinet_releases_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabinet_releases
    ADD CONSTRAINT cabinet_releases_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: cabinet_releases cabinet_releases_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabinet_releases
    ADD CONSTRAINT cabinet_releases_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: deliberations deliberations_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliberations
    ADD CONSTRAINT deliberations_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.agenda(id) ON DELETE CASCADE;


--
-- Name: deliberations deliberations_signed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliberations
    ADD CONSTRAINT deliberations_signed_by_fkey FOREIGN KEY (signed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: documents documents_gov_memo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_gov_memo_id_fkey FOREIGN KEY (gov_memo_id) REFERENCES public.gov_memos(id);


--
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: gov_memos gov_memos_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_memos
    ADD CONSTRAINT gov_memos_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE SET NULL;


--
-- Name: gov_memos gov_memos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_memos
    ADD CONSTRAINT gov_memos_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: gov_memos gov_memos_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_memos
    ADD CONSTRAINT gov_memos_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: gov_memos gov_memos_state_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_memos
    ADD CONSTRAINT gov_memos_state_department_id_fkey FOREIGN KEY (state_department_id) REFERENCES public.state_departments(id) ON DELETE SET NULL;


--
-- Name: gov_memos gov_memos_submitting_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_memos
    ADD CONSTRAINT gov_memos_submitting_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: gov_memos gov_memos_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gov_memos
    ADD CONSTRAINT gov_memos_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: group_users group_users_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT group_users_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_users group_users_participation_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT group_users_participation_level_id_fkey FOREIGN KEY (mandatory_id) REFERENCES public.categories(id);


--
-- Name: group_users group_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT group_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: meeting_minutes meeting_minutes_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_minutes
    ADD CONSTRAINT meeting_minutes_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: meeting_minutes meeting_minutes_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_minutes
    ADD CONSTRAINT meeting_minutes_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: meeting_minutes meeting_minutes_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_minutes
    ADD CONSTRAINT meeting_minutes_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_minutes meeting_minutes_prepared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meeting_minutes
    ADD CONSTRAINT meeting_minutes_prepared_by_fkey FOREIGN KEY (prepared_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: meeting_participants meeting_participants_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT meeting_participants_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: meeting_participants meeting_participants_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT meeting_participants_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_participants meeting_participants_rsvp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT meeting_participants_rsvp_id_fkey FOREIGN KEY (rsvp_id) REFERENCES public.categories(id);


--
-- Name: meeting_participants meeting_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.meeting_participants
    ADD CONSTRAINT meeting_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: meetings meetings_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: meetings meetings_chair_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_chair_id_fkey FOREIGN KEY (chair_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: meetings meetings_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: memo_affected_entities memo_affected_entities_agency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_affected_entities
    ADD CONSTRAINT memo_affected_entities_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id) ON DELETE CASCADE;


--
-- Name: memo_affected_entities memo_affected_entities_memo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_affected_entities
    ADD CONSTRAINT memo_affected_entities_memo_id_fkey FOREIGN KEY (memo_id) REFERENCES public.gov_memos(id) ON DELETE CASCADE;


--
-- Name: memo_affected_entities memo_affected_entities_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_affected_entities
    ADD CONSTRAINT memo_affected_entities_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: memo_affected_entities memo_affected_entities_state_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_affected_entities
    ADD CONSTRAINT memo_affected_entities_state_department_id_fkey FOREIGN KEY (state_department_id) REFERENCES public.state_departments(id) ON DELETE CASCADE;


--
-- Name: memo_documents memo_documents_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_documents
    ADD CONSTRAINT memo_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: memo_documents memo_documents_memo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memo_documents
    ADD CONSTRAINT memo_documents_memo_id_fkey FOREIGN KEY (memo_id) REFERENCES public.gov_memos(id) ON DELETE CASCADE;


--
-- Name: ministries ministries_cabinet_secretary_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ministries
    ADD CONSTRAINT ministries_cabinet_secretary_fkey FOREIGN KEY (cabinet_secretary) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: ministries ministries_cluster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ministries
    ADD CONSTRAINT ministries_cluster_id_fkey FOREIGN KEY (cluster_id) REFERENCES public.clusters(id) ON DELETE SET NULL;


--
-- Name: presidential_signatures presidential_signatures_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presidential_signatures
    ADD CONSTRAINT presidential_signatures_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: presidential_signatures presidential_signatures_signed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.presidential_signatures
    ADD CONSTRAINT presidential_signatures_signed_by_fkey FOREIGN KEY (signed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: resource_files resource_files_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_files
    ADD CONSTRAINT resource_files_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id);


--
-- Name: resource_files resource_files_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_files
    ADD CONSTRAINT resource_files_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE CASCADE;


--
-- Name: resource_files resource_files_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resource_files
    ADD CONSTRAINT resource_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: resources resources_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: resources resources_resource_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_resource_type_id_fkey FOREIGN KEY (resource_type_id) REFERENCES public.categories(id);


--
-- Name: state_departments state_departments_ministry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.state_departments
    ADD CONSTRAINT state_departments_ministry_id_fkey FOREIGN KEY (ministry_id) REFERENCES public.ministries(id) ON DELETE CASCADE;


--
-- Name: user_notes user_notes_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notes
    ADD CONSTRAINT user_notes_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.agenda(id) ON DELETE CASCADE;


--
-- Name: user_notes user_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notes
    ADD CONSTRAINT user_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: admin
--

REVOKE ALL ON SCHEMA public FROM dennis;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO admin;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public GRANT ALL ON SEQUENCES  TO admin;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE admin IN SCHEMA public GRANT ALL ON TABLES  TO admin;


--
-- PostgreSQL database dump complete
--

\unrestrict 2j3gNbPboEhjeI5oLXy8IWONY1qCJVLAeaECk0rjjvWjkAvimenQRKrcobQz8Gi

