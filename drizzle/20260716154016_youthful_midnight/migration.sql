CREATE TABLE "locationTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "locationTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"locationName" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packagesTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "packagesTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"packageName" varchar(255) NOT NULL,
	"price" decimal NOT NULL,
	"imagePath" varchar(255),
	"details" varchar(1000),
	"vendorId" integer,
	"embedding" vector(3072) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servicesTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "servicesTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"serviceName" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "vendorsTable" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "vendorsTable_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"vendorName" varchar(255) NOT NULL,
	"serviceId" integer NOT NULL,
	"locationId" integer NOT NULL,
	"detail" varchar(500),
	"contact" int8,
	"imagePath" varchar(255),
	"description" varchar(1000),
	"embedding" vector(3072) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "packagesTable" ADD CONSTRAINT "packagesTable_vendorId_vendorsTable_id_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorsTable"("id");--> statement-breakpoint
ALTER TABLE "vendorsTable" ADD CONSTRAINT "vendorsTable_serviceId_servicesTable_id_fkey" FOREIGN KEY ("serviceId") REFERENCES "servicesTable"("id");--> statement-breakpoint
ALTER TABLE "vendorsTable" ADD CONSTRAINT "vendorsTable_locationId_locationTable_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locationTable"("id");