


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.users (
        auth_id,
        name,
        email,
        role,
        status,
        image,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'User'),
        'active',
        COALESCE(NEW.raw_user_meta_data->>'image', 'default.jpg'),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_admin_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.role = 'Admin' THEN
        NEW.status := 'active';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_admin_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_to_custom_table"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.users (
      auth_id, name, email, role, status, 
      phone, created_at, updated_at, image
    )
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
      'active',
      NEW.raw_user_meta_data->>'phone',
      NOW(),
      NOW(),
      NEW.raw_user_meta_data->>'image'
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_user_to_custom_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_permission"("p_user_email" "text", "p_permission_key" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_role_key TEXT;
    v_permissions JSONB;
    v_module TEXT;
    v_action TEXT;
BEGIN
    -- Get user's role
    SELECT LOWER(REPLACE(u.role, ' ', '_')) INTO v_role_key
    FROM users u
    WHERE u.email = p_user_email;
    
    IF v_role_key IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get role permissions
    SELECT permissions INTO v_permissions
    FROM system_roles
    WHERE role_key = v_role_key;
    
    IF v_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Parse permission key
    SELECT split_part(p_permission_key, '_', 1),
           split_part(p_permission_key, '_', 2)
    INTO v_module, v_action;
    
    -- Check if module exists and action is in permissions
    RETURN v_permissions->v_module ? v_action;
END;
$$;


ALTER FUNCTION "public"."user_has_permission"("p_user_email" "text", "p_permission_key" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."action_letters" (
    "id" integer NOT NULL,
    "deliberation_id" integer,
    "to_ministry_id" integer,
    "document_id" integer,
    "subject" character varying(500),
    "content" "text",
    "due_date" "date",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "sent_at" timestamp without time zone,
    "acknowledged_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."action_letters" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."action_letters_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."action_letters_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."action_letters_id_seq" OWNED BY "public"."action_letters"."id";



CREATE TABLE IF NOT EXISTS "public"."agencies" (
    "id" integer NOT NULL,
    "state_department_id" integer,
    "name" character varying(255) NOT NULL,
    "director_general" character varying(255),
    "acronym" character varying(255),
    "location" character varying(255),
    "website" character varying(255),
    "email" character varying(255),
    "phone" character varying(255),
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "chairperson" "text",
    "deleted_at" timestamp with time zone,
    "status_id" integer
);


ALTER TABLE "public"."agencies" OWNER TO "postgres";


COMMENT ON COLUMN "public"."agencies"."chairperson" IS 'Chairperson of the agency board';



COMMENT ON COLUMN "public"."agencies"."deleted_at" IS 'Soft delete timestamp';



COMMENT ON COLUMN "public"."agencies"."status_id" IS 'Reference to status lookup table';



CREATE SEQUENCE IF NOT EXISTS "public"."agencies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."agencies_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."agencies_id_seq" OWNED BY "public"."agencies"."id";



CREATE TABLE IF NOT EXISTS "public"."agenda" (
    "id" integer NOT NULL,
    "meeting_id" integer,
    "memo_id" integer,
    "name" character varying(500) NOT NULL,
    "ministry_id" integer,
    "presenter_id" integer,
    "sort_order" integer,
    "description" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "cabinet_approval_required" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "created_by" integer
);


ALTER TABLE "public"."agenda" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agenda_documents" (
    "id" integer NOT NULL,
    "agenda_id" integer,
    "name" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "file_type" "text",
    "file_url" "text",
    "file_size" integer,
    "uploaded_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "metadata" "jsonb",
    "uploaded_by" integer
);


ALTER TABLE "public"."agenda_documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."agenda_documents_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."agenda_documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."agenda_documents_id_seq" OWNED BY "public"."agenda_documents"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."agenda_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."agenda_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."agenda_id_seq" OWNED BY "public"."agenda"."id";



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" integer NOT NULL,
    "user_id" integer,
    "action" character varying(100) NOT NULL,
    "target_type" character varying(100),
    "target_id" integer,
    "metadata" "jsonb",
    "ip_address" character varying(45),
    "user_agent" "text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."audit_logs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."audit_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."audit_logs_id_seq" OWNED BY "public"."audit_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."cabinet_committees" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "cluster_id" integer,
    "chair_title" character varying(100) DEFAULT 'Deputy President'::character varying,
    "description" "text",
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."cabinet_committees" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."cabinet_committees_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cabinet_committees_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cabinet_committees_id_seq" OWNED BY "public"."cabinet_committees"."id";



CREATE TABLE IF NOT EXISTS "public"."cabinet_releases" (
    "id" integer NOT NULL,
    "meeting_id" integer,
    "document_id" integer,
    "title" character varying(500),
    "content" "text",
    "release_type" character varying(50) DEFAULT 'confidential'::character varying,
    "published_by" integer,
    "published_at" timestamp without time zone,
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."cabinet_releases" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."cabinet_releases_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cabinet_releases_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cabinet_releases_id_seq" OWNED BY "public"."cabinet_releases"."id";



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "type" character varying(50) NOT NULL,
    "icon" character varying(100),
    "colour" character varying(50),
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."categories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."categories_id_seq" OWNED BY "public"."categories"."id";



CREATE TABLE IF NOT EXISTS "public"."clusters" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "chair_ministry_id" integer,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."clusters" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."clusters_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."clusters_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."clusters_id_seq" OWNED BY "public"."clusters"."id";



CREATE TABLE IF NOT EXISTS "public"."deliberations" (
    "id" integer NOT NULL,
    "agenda_id" integer,
    "discussion_summary" "text",
    "recommendations" "text",
    "decision_type" character varying(50),
    "decision_text" "text",
    "requires_president_signature" boolean DEFAULT false,
    "signed_by" integer,
    "signed_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."deliberations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."deliberations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."deliberations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."deliberations_id_seq" OWNED BY "public"."deliberations"."id";



CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" integer NOT NULL,
    "name" character varying(500) NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_path" character varying(500) NOT NULL,
    "file_size" integer,
    "mime_type" character varying(100),
    "document_type" character varying(50) NOT NULL,
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "access_level" character varying(20) DEFAULT 'restricted'::character varying,
    "uploaded_by" integer,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "gov_memo_id" integer
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."documents_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."documents_id_seq" OWNED BY "public"."documents"."id";



CREATE TABLE IF NOT EXISTS "public"."gov_memos" (
    "id" integer NOT NULL,
    "name" character varying(500) NOT NULL,
    "summary" "text",
    "body" "text",
    "memo_type" character varying(50) DEFAULT 'cabinet'::character varying,
    "ministry_id" integer,
    "priority" character varying(20) DEFAULT 'medium'::character varying,
    "status" character varying(50) DEFAULT 'draft'::character varying,
    "created_by" integer,
    "submitted_at" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "state_department_id" integer,
    "agency_id" integer,
    "updated_by" integer
);


ALTER TABLE "public"."gov_memos" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."gov_memos_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."gov_memos_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."gov_memos_id_seq" OWNED BY "public"."gov_memos"."id";



CREATE TABLE IF NOT EXISTS "public"."group_users" (
    "id" integer NOT NULL,
    "group_id" integer,
    "mandatory_id" integer,
    "user_id" "uuid"
);


ALTER TABLE "public"."group_users" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."group_users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."group_users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."group_users_id_seq" OWNED BY "public"."group_users"."id";



CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."groups_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."groups_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."groups_id_seq" OWNED BY "public"."groups"."id";



CREATE TABLE IF NOT EXISTS "public"."meeting_minutes" (
    "id" integer NOT NULL,
    "meeting_id" integer,
    "document_id" integer,
    "prepared_by" integer,
    "approved_by" integer,
    "approved_at" timestamp without time zone,
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."meeting_minutes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."meeting_minutes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."meeting_minutes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."meeting_minutes_id_seq" OWNED BY "public"."meeting_minutes"."id";



CREATE TABLE IF NOT EXISTS "public"."meeting_participants" (
    "id" integer NOT NULL,
    "meeting_id" integer,
    "group_id" integer,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "rsvp_id" integer,
    "user_id" "uuid"
);


ALTER TABLE "public"."meeting_participants" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."meeting_participants_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."meeting_participants_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."meeting_participants_id_seq" OWNED BY "public"."meeting_participants"."id";



CREATE TABLE IF NOT EXISTS "public"."meetings" (
    "id" integer NOT NULL,
    "name" character varying(500) NOT NULL,
    "type" character varying(50) DEFAULT 'cabinet_committee'::character varying,
    "start_at" timestamp without time zone,
    "location" character varying(255),
    "chair_id" integer,
    "status" character varying(20) DEFAULT 'scheduled'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "approved_by" integer,
    "created_by" integer,
    "description" "text",
    "period" integer,
    "actual_end" timestamp without time zone,
    "colour" character varying(20)
);


ALTER TABLE "public"."meetings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."meetings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."meetings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."meetings_id_seq" OWNED BY "public"."meetings"."id";



CREATE TABLE IF NOT EXISTS "public"."memo_affected_entities" (
    "id" integer NOT NULL,
    "memo_id" integer,
    "ministry_id" integer,
    "state_department_id" integer,
    "agency_id" integer,
    "entity_type" character varying(20) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."memo_affected_entities" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."memo_affected_entities_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."memo_affected_entities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."memo_affected_entities_id_seq" OWNED BY "public"."memo_affected_entities"."id";



CREATE TABLE IF NOT EXISTS "public"."memo_documents" (
    "id" integer NOT NULL,
    "memo_id" integer,
    "document_id" integer,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."memo_documents" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."memo_documents_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."memo_documents_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."memo_documents_id_seq" OWNED BY "public"."memo_documents"."id";



CREATE TABLE IF NOT EXISTS "public"."ministries" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "acronym" character varying(50),
    "cluster_id" integer,
    "cabinet_secretary" integer,
    "headquarters" character varying(255),
    "website" character varying(255),
    "email" character varying(255),
    "phone" character varying(50),
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."ministries" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ministries_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ministries_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ministries_id_seq" OWNED BY "public"."ministries"."id";



CREATE TABLE IF NOT EXISTS "public"."permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "permission_key" character varying(100) NOT NULL,
    "module" character varying(50) NOT NULL,
    "action" character varying(50) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."presidential_signatures" (
    "id" integer NOT NULL,
    "document_id" integer,
    "signed_by" integer,
    "signed_at" timestamp without time zone,
    "signature_type" character varying(50),
    "reference_id" integer,
    "reference_type" character varying(50),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."presidential_signatures" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."presidential_signatures_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."presidential_signatures_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."presidential_signatures_id_seq" OWNED BY "public"."presidential_signatures"."id";



CREATE TABLE IF NOT EXISTS "public"."resource_files" (
    "id" integer NOT NULL,
    "resource_id" integer,
    "name" character varying(255) NOT NULL,
    "display_name" character varying(255),
    "file_type" character varying(50),
    "file_url" character varying(500),
    "file_size" integer,
    "ministry_id" integer,
    "uploaded_by" integer,
    "uploaded_at" timestamp without time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."resource_files" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."resource_files_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."resource_files_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."resource_files_id_seq" OWNED BY "public"."resource_files"."id";



CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "display_name" character varying(255) NOT NULL,
    "resource_type_id" integer,
    "year" integer NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "created_by" integer,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."resources_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."resources_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."resources_id_seq" OWNED BY "public"."resources"."id";



CREATE TABLE IF NOT EXISTS "public"."role_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role_id" "uuid",
    "action" character varying(50) NOT NULL,
    "changes" "jsonb",
    "performed_by" integer,
    "performed_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."role_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role_id" "uuid",
    "permission_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."state_departments" (
    "id" integer NOT NULL,
    "ministry_id" integer,
    "name" character varying(255) NOT NULL,
    "principal_secretary" character varying(255),
    "location" character varying(255),
    "website" character varying(255),
    "email" character varying(255),
    "phone" character varying(255),
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "ps" character varying(255),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."state_departments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."state_departments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."state_departments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."state_departments_id_seq" OWNED BY "public"."state_departments"."id";



CREATE TABLE IF NOT EXISTS "public"."statuses" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."statuses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."statuses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."statuses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."statuses_id_seq" OWNED BY "public"."statuses"."id";



CREATE TABLE IF NOT EXISTS "public"."system_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role_key" character varying(50) NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "hierarchy_level" integer NOT NULL,
    "is_system_role" boolean DEFAULT true,
    "permissions" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."system_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" integer NOT NULL,
    "name" character varying(255) DEFAULT 'E-Cabinet System'::character varying,
    "version" character varying(50) DEFAULT '1.0.0'::character varying,
    "timezone" character varying(100) DEFAULT 'Africa/Nairobi'::character varying,
    "date_format" character varying(20) DEFAULT 'DD/MM/YYYY'::character varying,
    "language" character varying(50) DEFAULT 'English'::character varying,
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "meeting_reminders" boolean DEFAULT true,
    "deadline_alerts" boolean DEFAULT true,
    "weekly_reports" boolean DEFAULT false,
    "session_timeout" integer DEFAULT 30,
    "password_policy" character varying(50) DEFAULT 'strong'::character varying,
    "two_factor_auth" boolean DEFAULT true,
    "ip_whitelist" "text"[] DEFAULT ARRAY['192.168.1.0/24'::"text"],
    "audit_log_retention" integer DEFAULT 365,
    "smtp_enabled" boolean DEFAULT true,
    "smtp_server" character varying(255) DEFAULT 'smtp.gov.go.ke'::character varying,
    "smtp_port" integer DEFAULT 587,
    "file_storage" character varying(50) DEFAULT 'local'::character varying,
    "max_file_size" integer DEFAULT 10,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "logo" character varying(255),
    "slogan" character varying(255),
    "logo_auth" "text" DEFAULT '/images/logo/auth-logo.svg'::"text",
    "logo_dark" "text" DEFAULT '/images/logo/logo-dark.svg'::"text",
    "logo_icon" "text" DEFAULT '/images/logo/logo-icon.svg'::"text",
    "logo_primary" "text" DEFAULT '/images/logo/logo.svg'::"text",
    "primary_color" "text" DEFAULT '#3b82f6'::"text",
    "secondary_color" "text" DEFAULT '#1e40af'::"text",
    "favicon" "text" DEFAULT '/favicon.ico'::"text",
    "system_email" "text" DEFAULT 'noreply@cabinet.go.ke'::"text",
    "system_email_name" "text" DEFAULT 'boardms'::"text",
    "copyright_text" "text" DEFAULT '© {year} Government of Kenya. All rights reserved.'::"text",
    "description" "text"
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."system_settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."system_settings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."system_settings_id_seq" OWNED BY "public"."system_settings"."id";



CREATE TABLE IF NOT EXISTS "public"."user_notes" (
    "id" integer NOT NULL,
    "user_id" integer,
    "agenda_id" integer,
    "note_type" character varying(20) DEFAULT 'text'::character varying,
    "content" "text",
    "annotation_image_path" character varying(500),
    "page_number" integer,
    "coordinates" "jsonb",
    "is_private" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."user_notes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_notes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_notes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_notes_id_seq" OWNED BY "public"."user_notes"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "email" character varying(255) NOT NULL,
    "role" character varying(100) NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "phone" character varying(20),
    "last_login" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "image" "text",
    "auth_id" "uuid",
    CONSTRAINT "users_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['President'::character varying, 'Deputy President'::character varying, 'Prime Cabinet Secretary'::character varying, 'Cabinet Secretary'::character varying, 'Principal Secretary'::character varying, 'Cabinet Secretariat'::character varying, 'Director'::character varying, 'Assistant Director'::character varying, 'Admin'::character varying, 'Attorney General'::character varying, 'Secretary to the Cabinet'::character varying, 'Sysadmin'::character varying])::"text"[])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."users_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."users_id_seq" OWNED BY "public"."users"."id";



CREATE OR REPLACE VIEW "public"."v_user_roles" AS
 SELECT "u"."id" AS "user_id",
    "u"."name" AS "user_name",
    "u"."email",
    "u"."role" AS "user_role",
    "sr"."role_key",
    "sr"."hierarchy_level",
    "sr"."permissions" AS "role_permissions_json",
    "sr"."is_system_role"
   FROM ("public"."users" "u"
     LEFT JOIN "public"."system_roles" "sr" ON (("lower"("replace"(("u"."role")::"text", ' '::"text", '_'::"text")) = ("sr"."role_key")::"text")));


ALTER VIEW "public"."v_user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."action_letters" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."action_letters_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agencies" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."agencies_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agenda" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."agenda_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agenda_documents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."agenda_documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."audit_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."audit_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cabinet_committees" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cabinet_committees_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cabinet_releases" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cabinet_releases_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."categories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."clusters" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."clusters_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."deliberations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."deliberations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."documents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."gov_memos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."gov_memos_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."group_users" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."group_users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."groups" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."groups_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."meeting_minutes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."meeting_minutes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."meeting_participants" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."meeting_participants_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."meetings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."meetings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."memo_affected_entities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."memo_affected_entities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."memo_documents" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."memo_documents_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ministries" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."ministries_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."presidential_signatures" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."presidential_signatures_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."resource_files" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."resource_files_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."resources" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."resources_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."state_departments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."state_departments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."statuses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."statuses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."system_settings" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."system_settings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_notes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_notes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."users" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."users_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."action_letters"
    ADD CONSTRAINT "action_letters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_state_department_id_name_key" UNIQUE ("state_department_id", "name");



ALTER TABLE ONLY "public"."agenda_documents"
    ADD CONSTRAINT "agenda_documents_agenda_id_document_id_key" UNIQUE ("agenda_id", "name");



ALTER TABLE ONLY "public"."agenda_documents"
    ADD CONSTRAINT "agenda_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agenda"
    ADD CONSTRAINT "agenda_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cabinet_committees"
    ADD CONSTRAINT "cabinet_committees_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."cabinet_committees"
    ADD CONSTRAINT "cabinet_committees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cabinet_releases"
    ADD CONSTRAINT "cabinet_releases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clusters"
    ADD CONSTRAINT "clusters_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."clusters"
    ADD CONSTRAINT "clusters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliberations"
    ADD CONSTRAINT "deliberations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gov_memos"
    ADD CONSTRAINT "gov_memos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_users"
    ADD CONSTRAINT "group_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_minutes"
    ADD CONSTRAINT "meeting_minutes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meeting_participants"
    ADD CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memo_affected_entities"
    ADD CONSTRAINT "memo_affected_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memo_documents"
    ADD CONSTRAINT "memo_documents_memo_id_document_id_key" UNIQUE ("memo_id", "document_id");



ALTER TABLE ONLY "public"."memo_documents"
    ADD CONSTRAINT "memo_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ministries"
    ADD CONSTRAINT "ministries_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ministries"
    ADD CONSTRAINT "ministries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_permission_key_key" UNIQUE ("permission_key");



ALTER TABLE ONLY "public"."permissions"
    ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."presidential_signatures"
    ADD CONSTRAINT "presidential_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resource_files"
    ADD CONSTRAINT "resource_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_name_year_key" UNIQUE ("name", "year");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_audit_logs"
    ADD CONSTRAINT "role_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE ("role_id", "permission_id");



ALTER TABLE ONLY "public"."state_departments"
    ADD CONSTRAINT "state_departments_ministry_id_name_key" UNIQUE ("ministry_id", "name");



ALTER TABLE ONLY "public"."state_departments"
    ADD CONSTRAINT "state_departments_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."state_departments"
    ADD CONSTRAINT "state_departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."statuses"
    ADD CONSTRAINT "statuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_roles"
    ADD CONSTRAINT "system_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_roles"
    ADD CONSTRAINT "system_roles_role_key_key" UNIQUE ("role_key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "unique_auth_id" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."user_notes"
    ADD CONSTRAINT "user_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_action_letters_deliberation_id" ON "public"."action_letters" USING "btree" ("deliberation_id");



CREATE INDEX "idx_agenda_meeting_id" ON "public"."agenda" USING "btree" ("meeting_id");



CREATE INDEX "idx_agenda_memo_id" ON "public"."agenda" USING "btree" ("memo_id");



CREATE INDEX "idx_agenda_status" ON "public"."agenda" USING "btree" ("status");



CREATE INDEX "idx_deliberations_agenda_id" ON "public"."deliberations" USING "btree" ("agenda_id");



CREATE INDEX "idx_documents_access_level" ON "public"."documents" USING "btree" ("access_level");



CREATE INDEX "idx_gov_memos_created_by" ON "public"."gov_memos" USING "btree" ("created_by");



CREATE INDEX "idx_gov_memos_status" ON "public"."gov_memos" USING "btree" ("status");



CREATE INDEX "idx_gov_memos_submitting_ministry" ON "public"."gov_memos" USING "btree" ("ministry_id");



CREATE INDEX "idx_meetings_scheduled_at" ON "public"."meetings" USING "btree" ("start_at");



CREATE INDEX "idx_system_settings_latest" ON "public"."system_settings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_system_settings_updated" ON "public"."system_settings" USING "btree" ("updated_at");



CREATE INDEX "idx_user_notes_user_agenda" ON "public"."user_notes" USING "btree" ("user_id", "agenda_id");



CREATE OR REPLACE TRIGGER "trigger_set_admin_status" BEFORE INSERT OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_admin_status"();



CREATE OR REPLACE TRIGGER "update_system_settings_updated_at" BEFORE UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."action_letters"
    ADD CONSTRAINT "action_letters_deliberation_id_fkey" FOREIGN KEY ("deliberation_id") REFERENCES "public"."deliberations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."action_letters"
    ADD CONSTRAINT "action_letters_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."action_letters"
    ADD CONSTRAINT "action_letters_to_ministry_id_fkey" FOREIGN KEY ("to_ministry_id") REFERENCES "public"."ministries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_state_department_id_fkey" FOREIGN KEY ("state_department_id") REFERENCES "public"."state_departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agencies"
    ADD CONSTRAINT "agencies_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."statuses"("id");



ALTER TABLE ONLY "public"."agenda_documents"
    ADD CONSTRAINT "agenda_documents_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "public"."agenda"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agenda_documents"
    ADD CONSTRAINT "agenda_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."agenda"
    ADD CONSTRAINT "agenda_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agenda"
    ADD CONSTRAINT "agenda_memo_id_fkey" FOREIGN KEY ("memo_id") REFERENCES "public"."gov_memos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agenda"
    ADD CONSTRAINT "agenda_presenter_ministry_id_fkey" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cabinet_committees"
    ADD CONSTRAINT "cabinet_committees_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cabinet_releases"
    ADD CONSTRAINT "cabinet_releases_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cabinet_releases"
    ADD CONSTRAINT "cabinet_releases_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cabinet_releases"
    ADD CONSTRAINT "cabinet_releases_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deliberations"
    ADD CONSTRAINT "deliberations_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "public"."agenda"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliberations"
    ADD CONSTRAINT "deliberations_signed_by_fkey" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_gov_memo_id_fkey" FOREIGN KEY ("gov_memo_id") REFERENCES "public"."gov_memos"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meeting_participants"
    ADD CONSTRAINT "fk_meeting_participants_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("auth_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gov_memos"
    ADD CONSTRAINT "gov_memos_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gov_memos"
    ADD CONSTRAINT "gov_memos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gov_memos"
    ADD CONSTRAINT "gov_memos_ministry_id_fkey" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gov_memos"
    ADD CONSTRAINT "gov_memos_state_department_id_fkey" FOREIGN KEY ("state_department_id") REFERENCES "public"."state_departments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."gov_memos"
    ADD CONSTRAINT "gov_memos_submitting_ministry_id_fkey" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gov_memos"
    ADD CONSTRAINT "gov_memos_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."group_users"
    ADD CONSTRAINT "group_users_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_users"
    ADD CONSTRAINT "group_users_participation_level_id_fkey" FOREIGN KEY ("mandatory_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."group_users"
    ADD CONSTRAINT "group_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("auth_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_minutes"
    ADD CONSTRAINT "meeting_minutes_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meeting_minutes"
    ADD CONSTRAINT "meeting_minutes_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_minutes"
    ADD CONSTRAINT "meeting_minutes_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_minutes"
    ADD CONSTRAINT "meeting_minutes_prepared_by_fkey" FOREIGN KEY ("prepared_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meeting_participants"
    ADD CONSTRAINT "meeting_participants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id");



ALTER TABLE ONLY "public"."meeting_participants"
    ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meeting_participants"
    ADD CONSTRAINT "meeting_participants_rsvp_id_fkey" FOREIGN KEY ("rsvp_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_chair_id_fkey" FOREIGN KEY ("chair_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meetings"
    ADD CONSTRAINT "meetings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."memo_affected_entities"
    ADD CONSTRAINT "memo_affected_entities_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memo_affected_entities"
    ADD CONSTRAINT "memo_affected_entities_memo_id_fkey" FOREIGN KEY ("memo_id") REFERENCES "public"."gov_memos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memo_affected_entities"
    ADD CONSTRAINT "memo_affected_entities_ministry_id_fkey" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memo_affected_entities"
    ADD CONSTRAINT "memo_affected_entities_state_department_id_fkey" FOREIGN KEY ("state_department_id") REFERENCES "public"."state_departments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memo_documents"
    ADD CONSTRAINT "memo_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memo_documents"
    ADD CONSTRAINT "memo_documents_memo_id_fkey" FOREIGN KEY ("memo_id") REFERENCES "public"."gov_memos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ministries"
    ADD CONSTRAINT "ministries_cabinet_secretary_fkey" FOREIGN KEY ("cabinet_secretary") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ministries"
    ADD CONSTRAINT "ministries_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."presidential_signatures"
    ADD CONSTRAINT "presidential_signatures_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."presidential_signatures"
    ADD CONSTRAINT "presidential_signatures_signed_by_fkey" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."resource_files"
    ADD CONSTRAINT "resource_files_ministry_id_fkey" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id");



ALTER TABLE ONLY "public"."resource_files"
    ADD CONSTRAINT "resource_files_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resource_files"
    ADD CONSTRAINT "resource_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_resource_type_id_fkey" FOREIGN KEY ("resource_type_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."role_audit_logs"
    ADD CONSTRAINT "role_audit_logs_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."role_audit_logs"
    ADD CONSTRAINT "role_audit_logs_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."system_roles"("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."system_roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."state_departments"
    ADD CONSTRAINT "state_departments_ministry_id_fkey" FOREIGN KEY ("ministry_id") REFERENCES "public"."ministries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notes"
    ADD CONSTRAINT "user_notes_agenda_id_fkey" FOREIGN KEY ("agenda_id") REFERENCES "public"."agenda"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notes"
    ADD CONSTRAINT "user_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow all operations for authenticated users" ON "public"."resources" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all operations for authenticated users on resource_files" ON "public"."resource_files" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow read access to categories for all" ON "public"."categories" FOR SELECT USING (true);



ALTER TABLE "public"."permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_categories" ON "public"."categories" FOR SELECT USING (true);



ALTER TABLE "public"."role_audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_all_categories" ON "public"."categories" USING ((CURRENT_USER = 'authenticated'::"name"));



CREATE POLICY "service_role_all_resource_files" ON "public"."resource_files" USING ((CURRENT_USER = 'authenticated'::"name"));



CREATE POLICY "service_role_all_resources" ON "public"."resources" USING ((CURRENT_USER = 'authenticated'::"name"));



ALTER TABLE "public"."system_roles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_admin_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_admin_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_admin_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_to_custom_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_to_custom_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_to_custom_table"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_permission"("p_user_email" "text", "p_permission_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_permission"("p_user_email" "text", "p_permission_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_permission"("p_user_email" "text", "p_permission_key" "text") TO "service_role";



GRANT ALL ON TABLE "public"."action_letters" TO "anon";
GRANT ALL ON TABLE "public"."action_letters" TO "authenticated";
GRANT ALL ON TABLE "public"."action_letters" TO "service_role";



GRANT ALL ON SEQUENCE "public"."action_letters_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."action_letters_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."action_letters_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."agencies" TO "anon";
GRANT ALL ON TABLE "public"."agencies" TO "authenticated";
GRANT ALL ON TABLE "public"."agencies" TO "service_role";



GRANT ALL ON SEQUENCE "public"."agencies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."agencies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."agencies_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."agenda" TO "anon";
GRANT ALL ON TABLE "public"."agenda" TO "authenticated";
GRANT ALL ON TABLE "public"."agenda" TO "service_role";



GRANT ALL ON TABLE "public"."agenda_documents" TO "anon";
GRANT ALL ON TABLE "public"."agenda_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."agenda_documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."agenda_documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."agenda_documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."agenda_documents_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."agenda_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."agenda_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."agenda_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cabinet_committees" TO "anon";
GRANT ALL ON TABLE "public"."cabinet_committees" TO "authenticated";
GRANT ALL ON TABLE "public"."cabinet_committees" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cabinet_committees_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cabinet_committees_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cabinet_committees_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cabinet_releases" TO "anon";
GRANT ALL ON TABLE "public"."cabinet_releases" TO "authenticated";
GRANT ALL ON TABLE "public"."cabinet_releases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cabinet_releases_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cabinet_releases_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cabinet_releases_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."clusters" TO "anon";
GRANT ALL ON TABLE "public"."clusters" TO "authenticated";
GRANT ALL ON TABLE "public"."clusters" TO "service_role";



GRANT ALL ON SEQUENCE "public"."clusters_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."clusters_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."clusters_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."deliberations" TO "anon";
GRANT ALL ON TABLE "public"."deliberations" TO "authenticated";
GRANT ALL ON TABLE "public"."deliberations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."deliberations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."deliberations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."deliberations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."gov_memos" TO "anon";
GRANT ALL ON TABLE "public"."gov_memos" TO "authenticated";
GRANT ALL ON TABLE "public"."gov_memos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."gov_memos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."gov_memos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."gov_memos_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."group_users" TO "anon";
GRANT ALL ON TABLE "public"."group_users" TO "authenticated";
GRANT ALL ON TABLE "public"."group_users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."group_users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."group_users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."group_users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."groups_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_minutes" TO "anon";
GRANT ALL ON TABLE "public"."meeting_minutes" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_minutes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."meeting_minutes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."meeting_minutes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."meeting_minutes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."meeting_participants" TO "anon";
GRANT ALL ON TABLE "public"."meeting_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."meeting_participants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."meeting_participants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."meeting_participants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."meeting_participants_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."meetings" TO "anon";
GRANT ALL ON TABLE "public"."meetings" TO "authenticated";
GRANT ALL ON TABLE "public"."meetings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."meetings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."meetings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."meetings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."memo_affected_entities" TO "anon";
GRANT ALL ON TABLE "public"."memo_affected_entities" TO "authenticated";
GRANT ALL ON TABLE "public"."memo_affected_entities" TO "service_role";



GRANT ALL ON SEQUENCE "public"."memo_affected_entities_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."memo_affected_entities_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."memo_affected_entities_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."memo_documents" TO "anon";
GRANT ALL ON TABLE "public"."memo_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."memo_documents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."memo_documents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."memo_documents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."memo_documents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ministries" TO "anon";
GRANT ALL ON TABLE "public"."ministries" TO "authenticated";
GRANT ALL ON TABLE "public"."ministries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ministries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ministries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ministries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."permissions" TO "anon";
GRANT ALL ON TABLE "public"."permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."permissions" TO "service_role";



GRANT ALL ON TABLE "public"."presidential_signatures" TO "anon";
GRANT ALL ON TABLE "public"."presidential_signatures" TO "authenticated";
GRANT ALL ON TABLE "public"."presidential_signatures" TO "service_role";



GRANT ALL ON SEQUENCE "public"."presidential_signatures_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."presidential_signatures_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."presidential_signatures_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."resource_files" TO "anon";
GRANT ALL ON TABLE "public"."resource_files" TO "authenticated";
GRANT ALL ON TABLE "public"."resource_files" TO "service_role";



GRANT ALL ON SEQUENCE "public"."resource_files_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."resource_files_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."resource_files_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON SEQUENCE "public"."resources_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."resources_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."resources_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."role_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."role_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."role_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."state_departments" TO "anon";
GRANT ALL ON TABLE "public"."state_departments" TO "authenticated";
GRANT ALL ON TABLE "public"."state_departments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."state_departments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."state_departments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."state_departments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."statuses" TO "anon";
GRANT ALL ON TABLE "public"."statuses" TO "authenticated";
GRANT ALL ON TABLE "public"."statuses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."statuses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."statuses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."statuses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."system_roles" TO "anon";
GRANT ALL ON TABLE "public"."system_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."system_roles" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."system_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."system_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."system_settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_notes" TO "anon";
GRANT ALL ON TABLE "public"."user_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."user_notes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_notes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_notes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_notes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."v_user_roles" TO "anon";
GRANT ALL ON TABLE "public"."v_user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."v_user_roles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







