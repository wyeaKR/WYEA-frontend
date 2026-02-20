<script setup lang="ts">

</script>

<template>
  <section class="privacy-policy">
    <h1>개인정보 처리방침</h1>
    <p>
      [세계 청년 교류회](이하 ‘WYEA’라 한다)은(는) 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다.
      이에 「개인정보 보호법」 제30조에 따라 정보 주체에게 개인정보 처리에 관한 절차 및 기준을 안내하고,
      이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
    </p>

    <h2>1. 수집하는 개인정보 항목</h2>
    <p>
      본 단체는 다음과 같은 개인정보를 수집할 수 있습니다.<br />
      - 필수항목: 이름, 이메일, 전화번호<br />
      - 선택항목: 추후 추가
    </p>

    <h2>2. 개인정보의 수집 및 이용 목적</h2>
    <p>
      수집된 개인정보는 다음의 목적을 위해 이용됩니다.<br />
      - 문의사항 응답 및 소통<br />
      - 회원 관리 및 소식지 발송<br />
      - 후원 및 활동 참여 관련 안내
    </p>

    <h2>3. 개인정보의 보유 및 이용 기간</h2>
    <p>
      WYEA는 개인정보 처리목적 달성, 보유기간 경과 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
      다만, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관할 수 있습니다.
    </p>

    <h2>4. 개인정보의 제3자 제공</h2>
    <p>
      본 단체는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.
      다만, 법령에 의거하거나 이용자의 동의가 있는 경우 예외적으로 제공될 수 있습니다.
    </p>

    <h2>5. 개인정보 처리의 위탁</h2>
    <p>
      원활한 업무 처리를 위하여 필요한 경우, 개인정보 처리 업무를 외부에 위탁할 수 있으며
      위탁 시 관계 법령에 따라 안전하게 관리되도록 감독합니다.
    </p>

    <h2>6. 정보주체의 권리와 행사 방법</h2>
    <p>
      이용자는 언제든지 자신의 개인정보 열람, 정정, 삭제, 처리 정지를 요구할 수 있습니다.
      개인정보 관련 문의 및 권리 행사는 아래 연락처를 통해 가능합니다.
    </p>

    <h2>7. 개인정보 보호책임자</h2>
    <p>개인정보 보호책임자</p>
    <p>
      - 성명: 이창현<br />
      - 직책: 대표<br />
      - 이메일: wyea@wyea.info<br />
      - 연락처:
    </p>

    <h2>8. 기타</h2>
    <p>
      본 개인정보 처리방침은 2025년 10월 2일부터 적용됩니다.
      법령, 정책 또는 보안기술 변경에 따라 내용이 추가, 삭제 및 수정될 수 있으며,
      변경되는 경우 본 웹사이트를 통해 공지합니다.
    </p>
  </section>
</template>

<style scoped>
.privacy-policy {
  max-width: 800px;
  margin: 7rem auto;
  line-height: 1.6;
}
.privacy-policy h1 {
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-weight: 700;
}
@media (max-width: 1000px) {
  .privacy-policy h1 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
  }
}
.privacy-policy h2 {
  margin-top: 1.5rem;
  font-size: 1.2rem;
  font-weight: 500;
}

@media (max-width: 1000px) {
  .privacy-policy {
    margin: 3rem 1rem; /* 양옆 여백 줄이기 */
    font-size: 0.95rem; /* 본문 글자 조금 축소 */
  }

  .privacy-policy h1 {
    font-size: 1.5rem;  /* 메인 제목 조금 축소 */
    margin-bottom: 0.8rem;
  }

  .privacy-policy h2 {
    font-size: 1.05rem; /* 섹션 제목 조금 축소 */
    margin-top: 1.2rem;
  }

  .privacy-policy p {
    font-size: 0.95rem; /* 본문 글씨 크기 */
    line-height: 1.5;   /* 줄간격 살짝 줄임 */
  }
}

@media (min-width: 2560px) {
  .privacy-policy {
    max-width: 1064px;   /* 800px × 1.33 */
    margin: 9.3rem auto; /* 7rem × 1.33 */
    font-size: 1.27rem;  /* 본문 기본 글씨도 약간 키움 */
  }

  .privacy-policy h1 {
    font-size: 2.4rem;      /* 1.8rem × 1.33 */
    margin-bottom: 1.3rem;  /* 1rem × 1.33 */
  }

  .privacy-policy h2 {
    font-size: 1.6rem;    /* 1.2rem × 1.33 */
    margin-top: 2rem;     /* 1.5rem × 1.33 */
  }

  .privacy-policy p {
    font-size: 1.27rem;   /* 본문 글씨 키움 */
    line-height: 1.7;     /* 줄간격 약간 넓힘 */
  }
}
</style>
