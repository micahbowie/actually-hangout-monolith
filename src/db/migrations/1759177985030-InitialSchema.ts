import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1759177985030 implements MigrationInterface {
  name = 'InitialSchema1759177985030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_mood_enum" AS ENUM('going_out', 'going_online', 'staying_in', 'anti_social')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" integer NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "clerk_id" character varying NOT NULL, "email" character varying, "profile_image_url" character varying, "banner_image_url" character varying, "username" character varying, "birthday" TIMESTAMP, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "last_sign_in_at" TIMESTAMP NOT NULL, "uuid" character varying NOT NULL, "phone_number" character varying NOT NULL, "push_tokens" jsonb NOT NULL DEFAULT '[]', "mood" "public"."users_mood_enum" NOT NULL DEFAULT 'anti_social', CONSTRAINT "UQ_951b8f1dfc94ac1d0301a14b7e1" UNIQUE ("uuid"), CONSTRAINT "UQ_17d1817f241f10a3dbafb169fd2" UNIQUE ("phone_number"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_17d1817f241f10a3dbafb169fd" ON "users" ("phone_number") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_951b8f1dfc94ac1d0301a14b7e" ON "users" ("uuid") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."hangouts_visibility_enum" AS ENUM('public', 'private', 'friends')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."hangouts_status_enum" AS ENUM('pending', 'finalized', 'cancelled', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "hangouts" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "description" text, "street1" character varying(255), "street2" character varying(255), "city" character varying(255), "state" character varying(255), "zip_code" character varying(255), "country" character varying(255), "longitude" numeric(11,8), "latitude" numeric(11,8), "location_name" character varying, "visibility" "public"."hangouts_visibility_enum" NOT NULL DEFAULT 'public', "status" "public"."hangouts_status_enum" NOT NULL DEFAULT 'pending', "group_decision_anonymous_voting_enabled" boolean NOT NULL DEFAULT false, "group_decision_anonymous_suggestions_enabled" boolean NOT NULL DEFAULT false, "group_decision_suggestions_per_person" integer NOT NULL DEFAULT '1', "group_decision_votes_per_person" integer NOT NULL DEFAULT '1', "group_decision_suggestion_deadline" TIMESTAMP, "group_decision_voting_deadline" TIMESTAMP, "collaboration_mode" boolean NOT NULL DEFAULT false, "start_date_time" TIMESTAMP, "end_date_time" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_e699b683d514043c8354ee5696a" UNIQUE ("uuid"), CONSTRAINT "PK_899dfba966ea0bf9f24f6de1352" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17b55e8cdfeb723f396bc5228b" ON "hangouts" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56c55624bde6805b95dc729b3c" ON "hangouts" ("collaboration_mode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ea410d54a7ab6480815aee035" ON "hangouts" ("end_date_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_07a7e417e614e10a635b0f8d24" ON "hangouts" ("start_date_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8c6e49f2bf4d344433534991ae" ON "hangouts" ("visibility") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f626459d3b16a8d5bafec1cc1" ON "hangouts" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b0c7303ba5bf497a28ee168523" ON "hangouts" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "suggestions" ("id" SERIAL NOT NULL, "suggestion_type" character varying(20) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "location_name" character varying(255), "location_address" text, "location_latitude" numeric(10,8), "location_longitude" numeric(11,8), "activity_name" character varying(255), "activity_description" text, "suggested_date" date, "suggested_start_time" TIMESTAMP WITH TIME ZONE, "suggested_end_time" TIMESTAMP WITH TIME ZONE, "suggested_timezone" character varying, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, "hangout_id" integer NOT NULL, CONSTRAINT "UQ_513a7729cabeb42ac930253a214" UNIQUE ("uuid"), CONSTRAINT "CHK_e5be6fdd16ef0f619f35a8a01a" CHECK (suggestion_type != 'time' OR (suggested_date IS NOT NULL AND suggested_start_time IS NOT NULL)), CONSTRAINT "CHK_ef4107c512daeecb80456807f1" CHECK (suggestion_type != 'activity' OR activity_name IS NOT NULL), CONSTRAINT "CHK_b7f6468d234c9678023ac633dc" CHECK (suggestion_type != 'location' OR location_name IS NOT NULL), CONSTRAINT "CHK_a6eb4b269c1d98f09e97fa39c0" CHECK (status IN ('pending', 'accepted', 'rejected')), CONSTRAINT "CHK_21f7795b43b81e4591390ebca0" CHECK (suggestion_type IN ('location', 'activity', 'time')), CONSTRAINT "PK_745bbcb037ac379969b5fc7b352" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad5211c9b62706b04224e9da30" ON "suggestions" ("hangout_id", "suggestion_type") WHERE status = 'pending'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6499ee9fe99eb602d3d76e6bf3" ON "suggestions" ("hangout_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1cd614469384951bd9ed5fd6b8" ON "suggestions" ("suggestion_type", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5f8b29a35d481f2c4200dae9e" ON "suggestions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3abbcd4b52164ac04769b9202" ON "suggestions" ("hangout_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reactions_reaction_type_enum" AS ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'thumbs_up', 'thumbs_down', 'fire', 'heart_eyes')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reactions_reactable_type_enum" AS ENUM('hangout', 'feeler', 'pindrop', 'suggestion')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reactions" ("id" SERIAL NOT NULL, "reaction_type" "public"."reactions_reaction_type_enum" NOT NULL, "reactable_type" "public"."reactions_reactable_type_enum" NOT NULL, "reactable_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_2b90f7342b7ea62cbe81379e342" UNIQUE ("uuid"), CONSTRAINT "PK_0b213d460d0c473bc2fb6ee27f3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d83e9bab6d61f940d640ad6123" ON "reactions" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef433b39cb53d4c38fc42aef3e" ON "reactions" ("reaction_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dde6062145a93649adc5af3946" ON "reactions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eb1387d402d4a42bc41e9c517f" ON "reactions" ("reactable_type", "reactable_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c58757a196bc35c343297e2c2f" ON "reactions" ("user_id", "reactable_type", "reactable_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "pindrops" ("id" SERIAL NOT NULL, "street1" character varying(255), "street2" character varying(255), "city" character varying(255), "state" character varying(255), "zip_code" character varying(255), "country" character varying(255), "longitude" numeric(11,8), "latitude" numeric(11,8), "location_name" character varying, "caption" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_d4d83375b0b1ea532cdab3939d5" UNIQUE ("uuid"), CONSTRAINT "PK_6a52006349be3f1ee35e0733120" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8a2de9873e670860ed118c7fa3" ON "pindrops" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_448fa30e4c6a13ce00f84e3693" ON "pindrops" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."votes_vote_type_enum" AS ENUM('upvote', 'downvote')`,
    );
    await queryRunner.query(
      `CREATE TABLE "votes" ("id" SERIAL NOT NULL, "vote_type" "public"."votes_vote_type_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "suggestion_id" integer NOT NULL, "voter_id" integer NOT NULL, CONSTRAINT "UQ_ca4cf7330afc88d84974ec09090" UNIQUE ("uuid"), CONSTRAINT "PK_f3d9fd4a0af865152c3f59db8ff" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b2afab8d0ed9265f472206d4a" ON "votes" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8a35b2f4e9c0b517dd63ee5cba" ON "votes" ("vote_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_907ed58b724f8debe4200e51af" ON "votes" ("voter_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2a76433cb99f147472621685f" ON "votes" ("suggestion_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7426a120269cef0489024ff77b" ON "votes" ("suggestion_id", "voter_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('feeler_posted', 'hangout_availability_reminder', 'hangout_invite', 'hangout_update', 'hangout_reminder', 'hangout_cancelled', 'system_announcement', 'friendship_created')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_category_enum" AS ENUM('social', 'hangout', 'system', 'reminders', 'feed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "message" text NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "priority" "public"."notifications_priority_enum" NOT NULL DEFAULT 'medium', "category" "public"."notifications_category_enum" NOT NULL, "metadata" jsonb, "action_url" character varying(500), "action_label" character varying(100), "group_id" character varying(100), "batch_id" character varying(100), "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_84989adc90ebf9f1c9b7ba66f0a" UNIQUE ("uuid"), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eaba0138c54227e2eafd728812" ON "notifications" ("group_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_77ee7b06d6f802000c0846f3a5" ON "notifications" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7839fac2ab3deda259a96f8ada" ON "notifications" ("category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1d992705797d7d2d5a3853ad9c" ON "notifications" ("priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aef1c7aef3725068e5540f8f00" ON "notifications" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f12148ce379462ebbb4d06cc13" ON "notifications" ("is_read") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a8a82462cab47c73d25f49261" ON "notifications" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_status_enum" AS ENUM('pending', 'accepted', 'declined', 'maybe')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."invitations_role_enum" AS ENUM('invitee', 'collaborator', 'organizer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "invitations" ("id" SERIAL NOT NULL, "status" "public"."invitations_status_enum" NOT NULL DEFAULT 'pending', "role" "public"."invitations_role_enum" NOT NULL DEFAULT 'invitee', "message" text, "responded_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "hangout_id" integer NOT NULL, "invitee_id" integer NOT NULL, "inviter_id" integer NOT NULL, CONSTRAINT "UQ_8fa3ec2fe23b3604fa812f3fdcd" UNIQUE ("uuid"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2473599d58ea5debd5f802655" ON "invitations" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20e858a379731ab7f95c14a977" ON "invitations" ("role") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56ce8d405de7cdcedd31d900ba" ON "invitations" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9752bd6630e9c8a1e1b046b43e" ON "invitations" ("inviter_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_00a9fbc86a920e5788ffcb1dc3" ON "invitations" ("invitee_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4a293c1e5c9d73c8fd96c5457" ON "invitations" ("hangout_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d1dcc79d30b43baf4e6b7d0f6e" ON "invitations" ("hangout_id", "invitee_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "friend_requests" ("id" SERIAL NOT NULL, "status" "public"."friend_requests_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "requester_id" integer NOT NULL, "receiver_id" integer NOT NULL, CONSTRAINT "UQ_c63fd27db7f27dbae5f2a95b656" UNIQUE ("uuid"), CONSTRAINT "PK_3827ba86ce64ecb4b90c92eeea6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ce65f143c03c3071e41915ad2a" ON "friend_requests" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_781744f1014838837741581a8b" ON "friend_requests" ("receiver_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a4e62994c6be786cd48cc5255" ON "friend_requests" ("requester_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_21e005f3cd857dcbd8b3da5508" ON "friend_requests" ("requester_id", "receiver_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "friends" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, "friend_id" integer NOT NULL, CONSTRAINT "UQ_06061f4499561eaf4c97ee23c11" UNIQUE ("uuid"), CONSTRAINT "PK_65e1b06a9f379ee5255054021e1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c9d447f72456a67d17ec30c5d0" ON "friends" ("friend_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2534e418d51fa6e5e8cdd4b48" ON "friends" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_99b814d75e2f39700ad0e0827f" ON "friends" ("user_id", "friend_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "feelers" ("id" SERIAL NOT NULL, "message" text NOT NULL, "start_date_time" TIMESTAMP WITH TIME ZONE, "end_date_time" TIMESTAMP WITH TIME ZONE, "activity" character varying, "availability_slots" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_7c7dc1b4c5d500f9eafa8f0877c" UNIQUE ("uuid"), CONSTRAINT "PK_7c8c924188a9364c925878b5d98" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_47455f813d06b9b0ce5d65698a" ON "feelers" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc1633e35e796a2bcee2237a4b" ON "feelers" ("activity") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_696fbe8b999c430b293a86b18f" ON "feelers" ("end_date_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1345c615fabacce47f4028055" ON "feelers" ("start_date_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b32d0d23ce64aed5c5c3d182d" ON "feelers" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "availability_schedules" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "timezone" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_47aae32b7089e9ece817c01ad7b" UNIQUE ("uuid"), CONSTRAINT "PK_cfb5fcd683ea4ea6bec3183a216" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ab1b974023f4bc169e2a12cd2" ON "availability_schedules" ("user_id", "is_default") WHERE is_default = true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_30ceadecf3a1f9afe958d08b65" ON "availability_schedules" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "availability_rules" ("id" SERIAL NOT NULL, "day_of_week" integer NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "schedule_id" integer NOT NULL, CONSTRAINT "UQ_906ff789a1c0d0ff2175400b01e" UNIQUE ("uuid"), CONSTRAINT "CHK_b1dbe1d28fb510db05cd435f4a" CHECK ("end_time" > "start_time"), CONSTRAINT "CHK_3873dd40c1b4fa0bb7c50ea892" CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6), CONSTRAINT "PK_37dd3738c54ba3243cca374c2a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e3f928089d262323931060bd6d" ON "availability_rules" ("schedule_id", "day_of_week", "start_time", "end_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aaa3abef450829793f21d4e0c6" ON "availability_rules" ("schedule_id", "day_of_week") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7511e6c186a611cba570644779" ON "availability_rules" ("schedule_id") `,
    );
    await queryRunner.query(`CREATE TABLE "availability_overrides" ("id" SERIAL NOT NULL, "override_date" date NOT NULL, "is_available" boolean NOT NULL, "start_time" TIME, "end_time" TIME, "reason" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_ed15adfdcfb1239806eec900c54" UNIQUE ("uuid"), CONSTRAINT "CHK_fc0a6a0f210da09a43bd69ade9" CHECK (
  ("start_time" IS NULL AND "end_time" IS NULL) OR
  ("start_time" IS NOT NULL AND "end_time" IS NOT NULL AND "end_time" > "start_time")
), CONSTRAINT "PK_6538072d7a05f95e5c1444a10ba" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE INDEX "IDX_95aa1b2e5a2a69ec1ba463e622" ON "availability_overrides" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8ea22b26553ff25ae1a105a75b" ON "availability_overrides" ("user_id", "override_date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "app_settings" ("id" SERIAL NOT NULL, "push_notifications_enabled" boolean NOT NULL DEFAULT true, "acquaintance_discovery_enabled" boolean NOT NULL DEFAULT true, "pin_drop_location_masking_enabled" boolean NOT NULL DEFAULT false, "language" character varying(10) NOT NULL DEFAULT 'en', "timezone" character varying(50) NOT NULL DEFAULT 'UTC', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "UQ_da1a870e3213be8949c4db87580" UNIQUE ("uuid"), CONSTRAINT "REL_5713bedeb08176edc8075049b3" UNIQUE ("user_id"), CONSTRAINT "PK_4800b266ba790931744b3e53a74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5713bedeb08176edc8075049b3" ON "app_settings" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "acquaintances" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "uuid" character varying NOT NULL, "user_id" integer NOT NULL, "acquaintance_id" integer NOT NULL, "hangout_id" integer NOT NULL, CONSTRAINT "UQ_1ddf3a7a0c774ee7f521fe21fff" UNIQUE ("uuid"), CONSTRAINT "PK_62d9d17a39c82e87a9ab3b06356" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_50dcaf401ebbdc38b49da6339b" ON "acquaintances" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f3eb9f0c7ec96cf3cba3f7075c" ON "acquaintances" ("hangout_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9a12b6bd1d9d262f53e2150cd" ON "acquaintances" ("acquaintance_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_079a0eb6837517857888289534" ON "acquaintances" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f00e93cec668c1901d435901e3" ON "acquaintances" ("user_id", "acquaintance_id", "hangout_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "availabilities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "time_slots" jsonb NOT NULL, "is_all_day" boolean NOT NULL DEFAULT false, "note" text, "timezone" character varying(50), "timezone_offset" integer, "source" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_9562bd8681d40361b1a124ea52c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2453fabef4a77ce36c6fa4031" ON "availabilities" ("is_all_day") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f446b1940963ac42f5a2d2d93f" ON "availabilities" ("user_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b3bd0cc74740afb3d8ea5ecd82" ON "availabilities" ("date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5bcd4627ceda8d42e0ada3e74a" ON "availabilities" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "hangouts" ADD CONSTRAINT "FK_b0c7303ba5bf497a28ee168523a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" ADD CONSTRAINT "FK_d5f8b29a35d481f2c4200dae9e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" ADD CONSTRAINT "FK_a3abbcd4b52164ac04769b9202c" FOREIGN KEY ("hangout_id") REFERENCES "hangouts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reactions" ADD CONSTRAINT "FK_dde6062145a93649adc5af3946e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pindrops" ADD CONSTRAINT "FK_448fa30e4c6a13ce00f84e36936" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "votes" ADD CONSTRAINT "FK_c2a76433cb99f147472621685f6" FOREIGN KEY ("suggestion_id") REFERENCES "suggestions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "votes" ADD CONSTRAINT "FK_907ed58b724f8debe4200e51af3" FOREIGN KEY ("voter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_f4a293c1e5c9d73c8fd96c54574" FOREIGN KEY ("hangout_id") REFERENCES "hangouts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_00a9fbc86a920e5788ffcb1dc38" FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD CONSTRAINT "FK_9752bd6630e9c8a1e1b046b43e7" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_9a4e62994c6be786cd48cc52555" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friend_requests" ADD CONSTRAINT "FK_781744f1014838837741581a8b7" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friends" ADD CONSTRAINT "FK_f2534e418d51fa6e5e8cdd4b480" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "friends" ADD CONSTRAINT "FK_c9d447f72456a67d17ec30c5d00" FOREIGN KEY ("friend_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feelers" ADD CONSTRAINT "FK_6b32d0d23ce64aed5c5c3d182d3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_schedules" ADD CONSTRAINT "FK_30ceadecf3a1f9afe958d08b656" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_rules" ADD CONSTRAINT "FK_7511e6c186a611cba570644779e" FOREIGN KEY ("schedule_id") REFERENCES "availability_schedules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_overrides" ADD CONSTRAINT "FK_95aa1b2e5a2a69ec1ba463e6229" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" ADD CONSTRAINT "FK_5713bedeb08176edc8075049b3d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "acquaintances" ADD CONSTRAINT "FK_079a0eb6837517857888289534b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "acquaintances" ADD CONSTRAINT "FK_e9a12b6bd1d9d262f53e2150cd7" FOREIGN KEY ("acquaintance_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "acquaintances" ADD CONSTRAINT "FK_f3eb9f0c7ec96cf3cba3f7075c8" FOREIGN KEY ("hangout_id") REFERENCES "hangouts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "availabilities" ADD CONSTRAINT "FK_5bcd4627ceda8d42e0ada3e74a7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "availabilities" DROP CONSTRAINT "FK_5bcd4627ceda8d42e0ada3e74a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "acquaintances" DROP CONSTRAINT "FK_f3eb9f0c7ec96cf3cba3f7075c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "acquaintances" DROP CONSTRAINT "FK_e9a12b6bd1d9d262f53e2150cd7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "acquaintances" DROP CONSTRAINT "FK_079a0eb6837517857888289534b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "app_settings" DROP CONSTRAINT "FK_5713bedeb08176edc8075049b3d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_overrides" DROP CONSTRAINT "FK_95aa1b2e5a2a69ec1ba463e6229"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_rules" DROP CONSTRAINT "FK_7511e6c186a611cba570644779e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "availability_schedules" DROP CONSTRAINT "FK_30ceadecf3a1f9afe958d08b656"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feelers" DROP CONSTRAINT "FK_6b32d0d23ce64aed5c5c3d182d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friends" DROP CONSTRAINT "FK_c9d447f72456a67d17ec30c5d00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friends" DROP CONSTRAINT "FK_f2534e418d51fa6e5e8cdd4b480"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_781744f1014838837741581a8b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "friend_requests" DROP CONSTRAINT "FK_9a4e62994c6be786cd48cc52555"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_9752bd6630e9c8a1e1b046b43e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_00a9fbc86a920e5788ffcb1dc38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "invitations" DROP CONSTRAINT "FK_f4a293c1e5c9d73c8fd96c54574"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "votes" DROP CONSTRAINT "FK_907ed58b724f8debe4200e51af3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "votes" DROP CONSTRAINT "FK_c2a76433cb99f147472621685f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pindrops" DROP CONSTRAINT "FK_448fa30e4c6a13ce00f84e36936"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reactions" DROP CONSTRAINT "FK_dde6062145a93649adc5af3946e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" DROP CONSTRAINT "FK_a3abbcd4b52164ac04769b9202c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suggestions" DROP CONSTRAINT "FK_d5f8b29a35d481f2c4200dae9e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "hangouts" DROP CONSTRAINT "FK_b0c7303ba5bf497a28ee168523a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5bcd4627ceda8d42e0ada3e74a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b3bd0cc74740afb3d8ea5ecd82"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f446b1940963ac42f5a2d2d93f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f2453fabef4a77ce36c6fa4031"`,
    );
    await queryRunner.query(`DROP TABLE "availabilities"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f00e93cec668c1901d435901e3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_079a0eb6837517857888289534"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9a12b6bd1d9d262f53e2150cd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f3eb9f0c7ec96cf3cba3f7075c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_50dcaf401ebbdc38b49da6339b"`,
    );
    await queryRunner.query(`DROP TABLE "acquaintances"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5713bedeb08176edc8075049b3"`,
    );
    await queryRunner.query(`DROP TABLE "app_settings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8ea22b26553ff25ae1a105a75b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_95aa1b2e5a2a69ec1ba463e622"`,
    );
    await queryRunner.query(`DROP TABLE "availability_overrides"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7511e6c186a611cba570644779"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aaa3abef450829793f21d4e0c6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e3f928089d262323931060bd6d"`,
    );
    await queryRunner.query(`DROP TABLE "availability_rules"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_30ceadecf3a1f9afe958d08b65"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3ab1b974023f4bc169e2a12cd2"`,
    );
    await queryRunner.query(`DROP TABLE "availability_schedules"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b32d0d23ce64aed5c5c3d182d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d1345c615fabacce47f4028055"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_696fbe8b999c430b293a86b18f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cc1633e35e796a2bcee2237a4b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_47455f813d06b9b0ce5d65698a"`,
    );
    await queryRunner.query(`DROP TABLE "feelers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_99b814d75e2f39700ad0e0827f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f2534e418d51fa6e5e8cdd4b48"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c9d447f72456a67d17ec30c5d0"`,
    );
    await queryRunner.query(`DROP TABLE "friends"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_21e005f3cd857dcbd8b3da5508"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a4e62994c6be786cd48cc5255"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_781744f1014838837741581a8b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ce65f143c03c3071e41915ad2a"`,
    );
    await queryRunner.query(`DROP TABLE "friend_requests"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d1dcc79d30b43baf4e6b7d0f6e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f4a293c1e5c9d73c8fd96c5457"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_00a9fbc86a920e5788ffcb1dc3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9752bd6630e9c8a1e1b046b43e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56ce8d405de7cdcedd31d900ba"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_20e858a379731ab7f95c14a977"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b2473599d58ea5debd5f802655"`,
    );
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."invitations_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a8a82462cab47c73d25f49261"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f12148ce379462ebbb4d06cc13"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aef1c7aef3725068e5540f8f00"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1d992705797d7d2d5a3853ad9c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7839fac2ab3deda259a96f8ada"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_77ee7b06d6f802000c0846f3a5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eaba0138c54227e2eafd728812"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7426a120269cef0489024ff77b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c2a76433cb99f147472621685f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_907ed58b724f8debe4200e51af"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8a35b2f4e9c0b517dd63ee5cba"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b2afab8d0ed9265f472206d4a"`,
    );
    await queryRunner.query(`DROP TABLE "votes"`);
    await queryRunner.query(`DROP TYPE "public"."votes_vote_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_448fa30e4c6a13ce00f84e3693"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8a2de9873e670860ed118c7fa3"`,
    );
    await queryRunner.query(`DROP TABLE "pindrops"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c58757a196bc35c343297e2c2f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eb1387d402d4a42bc41e9c517f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dde6062145a93649adc5af3946"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ef433b39cb53d4c38fc42aef3e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d83e9bab6d61f940d640ad6123"`,
    );
    await queryRunner.query(`DROP TABLE "reactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."reactions_reactable_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."reactions_reaction_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3abbcd4b52164ac04769b9202"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d5f8b29a35d481f2c4200dae9e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1cd614469384951bd9ed5fd6b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6499ee9fe99eb602d3d76e6bf3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad5211c9b62706b04224e9da30"`,
    );
    await queryRunner.query(`DROP TABLE "suggestions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b0c7303ba5bf497a28ee168523"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3f626459d3b16a8d5bafec1cc1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8c6e49f2bf4d344433534991ae"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_07a7e417e614e10a635b0f8d24"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ea410d54a7ab6480815aee035"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56c55624bde6805b95dc729b3c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17b55e8cdfeb723f396bc5228b"`,
    );
    await queryRunner.query(`DROP TABLE "hangouts"`);
    await queryRunner.query(`DROP TYPE "public"."hangouts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."hangouts_visibility_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_951b8f1dfc94ac1d0301a14b7e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17d1817f241f10a3dbafb169fd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_mood_enum"`);
  }
}
