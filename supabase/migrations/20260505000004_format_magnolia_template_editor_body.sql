do $$
declare
  template_body text := $template$
# Vendor Collaboration Agreement (TFP - Trade for Photos)

- Event Name: Magnolia Styled Shoot
- Event Date: May 12, 2026
- Venue: Magnolia Event Center, South Jordan, Utah
- Organizer: Casa Cross / Event Host
- Vendor Name: {{participant_name}}
- Business Name (if applicable): ___________________________
- Contact Information: {{participant_email}} / {{participant_phone}}

---

## 1. Agreement Purpose
This agreement confirms that the Vendor listed above agrees to provide products and/or services for the Magnolia Styled Shoot on a Trade for Photos (TFP) basis. In exchange for their participation, the Vendor will receive professionally captured edited images from the event for promotional and portfolio use.

---

## 2. Vendor Contribution
The Vendor agrees to provide the following services/products:

______________________________________________________

______________________________________________________

All services/products are provided voluntarily in exchange for agreed-upon photographic content and not for direct monetary compensation unless otherwise stated in writing.

---

## 3. Event Schedule & Timing Requirements
- Vendor setup begins: 8:00 AM
- All setup must be fully completed by: 12:00 PM
- Main event begins: 12:00 PM
- Breakdown/cleanup must be completed by: 4:00 PM

The Vendor acknowledges that all materials, decor, rentals, products, and equipment must be removed from the Magnolia venue no later than 4:00 PM.

---

## 4. Venue Overage Fees
If any Vendor property, equipment, rentals, decor, or materials remain on Magnolia property after 4:00 PM, the Vendor agrees to be solely responsible for any resulting venue penalties.

Magnolia Venue Overage Fee:
- $500 per hour for any equipment or materials left onsite after 4:00 PM.

Vendor assumes full financial responsibility for these charges and agrees to pay Magnolia directly or reimburse the Event Host if charged.

---

## 5. Image Delivery
In exchange for services, Vendor will receive:
- Professionally edited images featuring their products/services
- Rights to use images for social media, website promotion, marketing materials, and portfolio purposes

Vendor agrees to credit photographers and/or event host when appropriate.

---

## 6. Vendor Responsibilities
Vendor agrees to:
- Arrive on time for setup
- Maintain professional conduct
- Deliver promised services/products as discussed
- Ensure all items meet agreed quality standards
- Remove all property by designated cleanup deadline
- Communicate any delays or issues promptly

---

## 7. Liability
The Event Host and Magnolia are not responsible for:
- Lost, stolen, or damaged vendor property
- Vendor staff injuries
- Vendor product malfunctions
- Vendor transportation issues

Vendor participates at their own risk and is responsible for securing their own insurance if desired.

---

## 8. Cancellation
If Vendor must cancel, they agree to notify the Event Host as soon as possible. Last-minute cancellations may impact future collaboration opportunities.

---

## 9. Agreement Acceptance
By signing below, Vendor acknowledges understanding and acceptance of all terms listed above.

Vendor Signature: ___________________________

Date: ___________________________

Event Host Signature: ___________________________

Date: ___________________________

---

Casa Cross / Magnolia Styled Shoot
$template$;
begin
  update public.contract_templates
  set
    description = 'TFP vendor collaboration agreement for the Magnolia Styled Shoot.',
    body_md = template_body,
    pdf_url = null
  where name = 'Magnolia Vendor Agreement';
end $$;
