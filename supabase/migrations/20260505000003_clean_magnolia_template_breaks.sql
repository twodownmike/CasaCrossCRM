update public.contract_templates
set body_md = replace(
  replace(body_md, chr(92) || chr(13) || chr(10), chr(10)),
  chr(92) || chr(10),
  chr(10)
)
where name = 'Magnolia Vendor Agreement';
