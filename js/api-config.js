const base = window.ENCODED_CRM || encodeURIComponent(window.CRM_NAME || "");

const apiEndpoints = {
  onHold: `https://script.google.com/macros/s/AKfycbx8Ourjem3diO9CTDl_wdGuJXSksFUImwIvq2gB1tFjeOUdNkLDdUso8he0-6CTlSJc/exec?crm=${base}`,
  ownerApproval: `https://script.google.com/macros/s/AKfycbyKrk1gF6A8SMLaYp5VRABDJpthkpPkQEB2rBDdlJJvJ09bBlcxuwHS9Trra_Uab71KWw/exec?crm=${base}`,
  level34: `https://script.google.com/macros/s/AKfycby7o8IwfJ1vgI-_2Ad-epHZHmOdVqTbNVWnncuv4BnDIiIcWNmuzrEspA9jIvgy9G84eQ/exec?crm=${base}`,
  level5: `https://script.google.com/macros/s/AKfycbyA-Q0NczExlSQmU9ZSNqFsUzVU5u3mK1gQewekQA2L7VOL7rJzTiI-Vmhqc3fiu9bb/exec?crm=${base}`,
  level6: `https://script.google.com/macros/s/AKfycbxkduAfhEpEtxKXA_HuIm-lZQj62ZPZwXeZ_Fol-v6VrzfhoXY2lffR64pjPahKV2o/exec?crm=${base}`,
  level7: `https://script.google.com/macros/s/AKfycbxMxIzOQmHv3LPTh6ca6i5uuguyH615cnjA5emEGNT0rmWpJlnrcg-KWNVP1DORkkcX/exec?crm=${base}`,
  level8: `https://script.google.com/macros/s/AKfycbwUr0UhENK6RGtdvYMC6-V0Khwb3kibKP4SLXC4nzL6Hm4idr6P-Olx4XTWvgZ_e2xk-Q/exec?crm=${base}`,
  level9: `https://script.google.com/macros/s/AKfycbyJ1CdfyAhTOhvxCYrE16rBYAfdVlrYpBLHMJj1UBB_xJvdcrUE3RBwNC9TDNMJpaZlWg/exec?crm=${base}`,
};
