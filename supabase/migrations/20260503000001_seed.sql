-- Optional seed: realistic starter data for Casa Cross.
-- Run AFTER you've signed in once (so you exist in team_members).
-- It's idempotent: re-running won't duplicate.

do $$
declare
  -- People
  p_eliza uuid; p_theo uuid; p_sloane uuid;
  p_naomi uuid; p_joaquin uuid; p_amara uuid; p_rosa uuid;
  p_petal uuid; p_linen uuid; p_hatchet uuid; p_sweet uuid;
  p_magnolia uuid; p_wildflower uuid;
  p_camille uuid; p_daphne uuid;
  p_moss uuid;
  p_heirloom uuid;
  -- Events
  e_magnolia uuid; e_coastal uuid; e_garden uuid; e_heirloom uuid; e_tuscany uuid;
begin
  if exists (select 1 from public.people limit 1) then
    return;
  end if;

  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Eliza Mendez','photographer','eliza@elizamendez.co','(512) 555-0188','@elizamendez.co','Austin, TX','Editorial wedding & lifestyle photographer. Light and shadow obsessive.','EM','var(--slate-tint)','var(--slate)','2026-01-12') returning id into p_eliza;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Theo Park','photographer','theo@theopark.studio','(512) 555-0142','@theo.park','Houston, TX','Film and digital. Soft tones, intimate moments.','TP','var(--slate-tint)','var(--slate)','2026-02-04') returning id into p_theo;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Sloane Whitaker','photographer','hi@sloanewhit.com','(214) 555-0107','@sloanewhit','Dallas, TX','Editorial focus. Past clients: Magnolia, Brides, Over the Moon.','SW','var(--slate-tint)','var(--slate)','2026-03-01') returning id into p_sloane;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Naomi Aldridge','model','naomi@aldridge.co','(512) 555-0119','@naomi.aldridge','Austin, TX','Bridal & editorial. Reps: Wallflower Mgmt.','NA','var(--rose-tint)','#a04e60','2026-01-19') returning id into p_naomi;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Joaquin Ferrer','model','joaquin@ferrer.io','(512) 555-0166','@joaquin.ferrer','San Antonio, TX','Groom/menswear. 6''1" / 40R.','JF','var(--rose-tint)','#a04e60','2026-02-08') returning id into p_joaquin;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Amara Doyle','model','a.doyle@ravenmgmt.com','(512) 555-0173','@amara.doyle','Austin, TX','Bridal & ready-to-wear. Reps: Raven Management.','AD','var(--rose-tint)','#a04e60','2026-02-15') returning id into p_amara;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Rosa Ibarra','model','rosa.ibarra@gmail.com','(512) 555-0151','@rosaibarra','Austin, TX','First-time model. Editorial & lifestyle.','RI','var(--rose-tint)','#a04e60','2026-03-04') returning id into p_rosa;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Petal & Stem Co.','vendor','hello@petalandstem.co','(512) 555-0123','@petalandstem','Austin, TX','Garden-style florals. Heirloom blooms and trailing greenery.','PS','var(--gold-tint)','#8a6c2e','2025-12-01') returning id into p_petal;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Linen & Lace Rentals','vendor','rent@linenandlace.com','(512) 555-0144','@linenandlace','Austin, TX','Tabletop, linens, vintage glassware. Curated rentals.','LL','var(--gold-tint)','#8a6c2e','2026-01-09') returning id into p_linen;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Hatchet & Hand','vendor','shop@hatchetandhand.co','(512) 555-0188','@hatchet.hand','Austin, TX','Handcrafted wood signage and arbors.','HH','var(--gold-tint)','#8a6c2e','2026-02-02') returning id into p_hatchet;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('The Sweet Page','vendor','orders@sweetpage.com','(512) 555-0177','@thesweetpage','Austin, TX','Cakes & desserts. Heirloom tomato cake is a signature.','SP','var(--gold-tint)','#8a6c2e','2026-02-12') returning id into p_sweet;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Magnolia Manor','venue','events@magnoliamanor.com','(830) 555-0102','@magnoliamanor.tx','Fredericksburg, TX','1890s manor on 12 acres. White columns, oak trees, magnolia gardens.','MM','var(--sage-tint)','var(--sage-deep)','2025-12-20') returning id into p_magnolia;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Wildflower Ridge','venue','book@wildflowerridge.com','(512) 555-0119','@wildflowerridge','Wimberley, TX','Hill country views, native landscaping.','WR','var(--sage-tint)','var(--sage-deep)','2026-02-18') returning id into p_wildflower;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Camille Roux','hmua','camille@rouxbeauty.co','(512) 555-0166','@rouxbeauty','Austin, TX','Editorial hair & makeup. Soft-glam specialist.','CR','#f0e8f0','#7a5a8a','2026-01-22') returning id into p_camille;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Daphne Liu','hmua','daphne@liustudio.com','(512) 555-0133','@daphneliu.beauty','Austin, TX','Bridal hair specialist. Loose updos & natural waves.','DL','#f0e8f0','#7a5a8a','2026-02-03') returning id into p_daphne;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Magnolia + Moss','stylist','studio@magnoliamoss.com','(512) 555-0188','@magnolia.and.moss','Austin, TX','Wardrobe styling for editorial bridal. Past: Brides, Magnolia Journal.','MM','var(--sage-tint)','var(--sage-deep)','2026-01-15') returning id into p_moss;
  insert into public.people (name, role, email, phone, instagram, location, bio, initials, tint, ink, joined_at) values
    ('Heirloom Bridal','sponsor','press@heirloombridal.co','(512) 555-0150','@heirloombridal','Austin, TX','Independent bridal boutique. Sponsoring 6 gowns for the May shoot.','HB','#ece8e0','#6e5e3a','2026-02-20') returning id into p_heirloom;

  insert into public.events (name, subtitle, description, date, time_label, cover, venue_id, location, status, stage, capacity, tags, moodboard) values
    ('Magnolia Bridal','Styled wedding shoot','An editorial bridal shoot inspired by 1890s southern romance. Heirloom florals, vintage tabletop, golden-hour portraits in the magnolia grove.','2026-05-12','8:00 AM – 6:00 PM','magnolia',p_magnolia,'Magnolia Manor, Fredericksburg','confirmed','prep',18, array['Editorial','Bridal','Hill Country'], array['#e8d5d0','#d4a89a','#b8654a','#f4e6e0','#1a1814','#9a948a']) returning id into e_magnolia;
  insert into public.events (name, subtitle, description, date, time_label, cover, venue_id, location, status, stage, capacity, tags, moodboard) values
    ('Coastal Vows','Beach elopement editorial','An intimate elopement-style shoot with hill country sunsets, native blooms, and barefoot moments.','2026-06-04','5:30 PM – 9:00 PM','coastal',p_wildflower,'Wildflower Ridge, Wimberley','planning','booking',12, array['Elopement','Sunset'], array['#d8e4e8','#a8b8c4','#5c6b7a','#e0e8d8','#f5f0e6','#1a1814']) returning id into e_coastal;
  insert into public.events (name, subtitle, description, date, time_label, cover, venue_id, location, status, stage, capacity, tags, moodboard) values
    ('Garden Party','Bridal showcase brunch','Garden party-style bridal showcase with three gown looks, brunch tablescape, and floral arches.','2026-07-19','10:00 AM – 3:00 PM','garden',null,'TBD — touring 3 venues','planning','pitching',24, array['Bridal','Daytime','Group'], array['#e0e8d8','#b0c0a0','#6b8068','#f4eed9','#fff5e0','#1a1814']) returning id into e_garden;
  insert into public.events (name, subtitle, description, date, time_label, cover, venue_id, location, status, stage, capacity, tags, moodboard) values
    ('Heirloom & Hearth','Fall vintage tablescape','Vintage fall tablescape with heirloom textiles, candlelight portraits, autumnal florals.','2026-10-08','3:00 PM – 8:00 PM','vintage',null,'Venue scouting','planning','idea',16, array['Fall','Tablescape'], array['#f0e4cc','#d4b890','#8a6c2e','#5a4530','#f5e6d3','#1a1814']) returning id into e_heirloom;
  insert into public.events (name, subtitle, description, date, time_label, cover, venue_id, location, status, stage, capacity, tags, moodboard) values
    ('Tuscany at Home','Olive grove engagement','Engagement-style editorial in a Texas olive grove — Tuscan inspired tablescape and golden-hour portraits.','2026-04-04','5:00 PM – 8:00 PM','tuscany',null,'Driftwood, TX','wrapped','wrapped',8, array['Engagement','Wrapped'], array['#f4e2c8','#d8a878','#a4683c','#5a3010','#fff5e6','#1a1814']) returning id into e_tuscany;

  -- Magnolia participants
  insert into public.participants (event_id, person_id, role, rate, paid, status, contract, due_date) values
    (e_magnolia, p_magnolia,'venue',0,0,'comp','signed',null),
    (e_magnolia, p_eliza,'photographer',450,450,'paid','signed',null),
    (e_magnolia, p_theo,'photographer',350,350,'paid','signed',null),
    (e_magnolia, p_naomi,'model',250,250,'paid','signed',null),
    (e_magnolia, p_joaquin,'model',250,0,'due','signed','2026-05-05'),
    (e_magnolia, p_rosa,'model',200,100,'partial','sent','2026-05-05'),
    (e_magnolia, p_petal,'vendor',600,600,'paid','signed',null),
    (e_magnolia, p_linen,'vendor',400,400,'paid','signed',null),
    (e_magnolia, p_hatchet,'vendor',350,0,'due','sent','2026-05-08'),
    (e_magnolia, p_sweet,'vendor',300,300,'paid','signed',null),
    (e_magnolia, p_camille,'hmua',400,400,'paid','signed',null),
    (e_magnolia, p_daphne,'hmua',350,0,'due','unsent','2026-05-08'),
    (e_magnolia, p_moss,'stylist',500,500,'paid','signed',null),
    (e_magnolia, p_heirloom,'sponsor',0,0,'comp','signed',null);

  -- Coastal participants
  insert into public.participants (event_id, person_id, role, rate, paid, status, contract, due_date) values
    (e_coastal, p_wildflower,'venue',0,0,'comp','signed',null),
    (e_coastal, p_eliza,'photographer',400,200,'partial','signed','2026-05-25'),
    (e_coastal, p_sloane,'photographer',450,0,'due','sent','2026-05-25'),
    (e_coastal, p_amara,'model',250,0,'due','sent','2026-05-30'),
    (e_coastal, p_petal,'vendor',500,0,'due','unsent','2026-05-28'),
    (e_coastal, p_camille,'hmua',400,0,'due','sent','2026-05-30');

  -- Garden participants
  insert into public.participants (event_id, person_id, role, rate, paid, status, contract) values
    (e_garden, p_sloane,'photographer',500,0,'due','unsent'),
    (e_garden, p_naomi,'model',300,0,'due','unsent'),
    (e_garden, p_linen,'vendor',600,0,'due','unsent');

  -- Heirloom participants
  insert into public.participants (event_id, person_id, role, rate, paid, status, contract) values
    (e_heirloom, p_theo,'photographer',400,0,'due','unsent'),
    (e_heirloom, p_amara,'model',300,0,'due','unsent'),
    (e_heirloom, p_hatchet,'vendor',500,0,'due','unsent'),
    (e_heirloom, p_moss,'stylist',600,0,'due','unsent');

  -- Tuscany participants (wrapped)
  insert into public.participants (event_id, person_id, role, rate, paid, status, contract) values
    (e_tuscany, p_eliza,'photographer',400,400,'paid','signed'),
    (e_tuscany, p_naomi,'model',200,200,'paid','signed'),
    (e_tuscany, p_joaquin,'model',200,200,'paid','signed'),
    (e_tuscany, p_petal,'vendor',350,350,'paid','signed');

  -- Magnolia tasks
  insert into public.tasks (event_id, title, done, due) values
    (e_magnolia,'Confirm final shot list with photographers',true,'2026-04-28'),
    (e_magnolia,'Send call sheet to all participants',true,'2026-05-05'),
    (e_magnolia,'Pick up sponsored gowns from Heirloom Bridal',false,'2026-05-10'),
    (e_magnolia,'Confirm hair trial schedule with Daphne',false,'2026-05-08'),
    (e_magnolia,'Final payment reminders (3 outstanding)',false,'2026-05-08'),
    (e_magnolia,'Pack styling kit & backup outfits',false,'2026-05-11');

  insert into public.tasks (event_id, title, done, due) values
    (e_coastal,'Lock final venue walkthrough',true,'2026-04-30'),
    (e_coastal,'Source vintage bicycle prop',false,'2026-05-15'),
    (e_coastal,'Book second model (couple shots)',false,'2026-05-15'),
    (e_coastal,'Send save-the-dates to participants',false,'2026-05-10');

  insert into public.tasks (event_id, title, done, due) values
    (e_garden,'Finalize venue (3 options)',false,'2026-05-15'),
    (e_garden,'Recruit 2 more models',false,'2026-05-30'),
    (e_garden,'Open vendor applications',false,'2026-06-01');

  insert into public.tasks (event_id, title, done, due) values
    (e_heirloom,'Define color story',false,'2026-06-01'),
    (e_heirloom,'Scout 5 venues',false,'2026-07-15');

  insert into public.activity (event_id, what, who, tone, occurred_at) values
    (e_magnolia,'Daphne Liu received contract','Auto-sent','', now() - interval '2 hours'),
    (e_magnolia,'Joaquin Ferrer''s payment is overdue','Reminder sent','accent', now() - interval '1 day'),
    (e_magnolia,'Camille Roux paid in full','$400.00','sage', now() - interval '2 days'),
    (e_magnolia,'Eliza Mendez signed contract','','sage', now() - interval '9 days'),
    (e_magnolia,'Magnolia Manor confirmed venue','','sage', now() - interval '11 days'),
    (e_coastal,'Sloane Whitaker viewed contract','','', now() - interval '1 day'),
    (e_coastal,'Wildflower Ridge confirmed venue','','sage', now() - interval '3 days'),
    (e_tuscany,'Final gallery delivered to all participants','','sage', now() - interval '21 days');

  insert into public.messages (event_id, sender_name, text, created_at) values
    (e_magnolia,'Eliza Mendez','Sunrise call time at 6:30 AM works for me — what time should the models arrive for HMU?', now() - interval '4 hours'),
    (e_magnolia,'You','Models at 7, HMU starts at 7:15. Sun''s up at 6:50 so we''ll have warm-up shots while they prep.', now() - interval '3 hours 50 minutes'),
    (e_magnolia,'Camille Roux','Daphne and I will be onsite at 6:45 to set up. Can confirm two stations for the morning rush.', now() - interval '3 hours 30 minutes'),
    (e_magnolia,'Naomi Aldridge','Bringing my own undergarments + nude heels per the prep doc. Excited 🌿', now() - interval '3 hours');
end $$;
