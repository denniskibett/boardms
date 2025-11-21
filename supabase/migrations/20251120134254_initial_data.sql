--
--




--
-- Name: set_admin_status(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE OR REPLACE FUNCTION public.set_admin_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.role = 'Admin' THEN
        NEW.status := 'active';
    END IF;
    RETURN NEW;
END;
$$;



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;





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



--
-- Data for Name: agencies; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: agenda; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: agenda_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cabinet_committees; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cabinet_releases; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: admin
--



--
-- Data for Name: clusters; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: deliberations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: gov_memos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: group_users; Type: TABLE DATA; Schema: public; Owner: admin
--



--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: admin
--



--
-- Data for Name: meeting_minutes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: meeting_participants; Type: TABLE DATA; Schema: public; Owner: admin
--



--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: memo_affected_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: memo_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ministries; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: presidential_signatures; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: resource_files; Type: TABLE DATA; Schema: public; Owner: admin
--



--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: admin
--



--
-- Data for Name: state_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: admin
--



--
-- Data for Name: user_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: action_letters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: agencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: agenda_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: agenda_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: cabinet_committees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: cabinet_releases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--



--
-- Name: clusters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: deliberations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: gov_memos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: group_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--



--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--



--
-- Name: meeting_minutes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: meeting_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--



--
-- Name: meetings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: memo_affected_entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: memo_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: ministries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: presidential_signatures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: resource_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--



--
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--



--
-- Name: state_departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--



--
-- Name: user_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--



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



--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: admin
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: admin
--



--
--


