<script setup lang="ts">

</script>

<template>
  <section class="privacy-policy">
    <h1>개인정보 처리방침</h1>

    <p>
      세계청년교류연합(이하 ‘WYEA’)은 개인정보 보호법 및 관계 법령을 준수하며,
      구성원의 개인정보를 안전하게 관리하기 위해 다음과 같이 개인정보 처리방침을 수립·공개합니다.
    </p>

    <h2>1. 수집 및 이용하는 개인정보</h2>
    <p>
      WYEA는 회원 및 활동 참여자의 관리와 원활한 단체 운영을 위해
      다음과 같은 개인정보를 수집·이용할 수 있습니다.
    </p>

    <ul>
      <li>이름</li>
      <li>전화번호</li>
      <li>소속 학교</li>
      <li>나이</li>
      <li>학년</li>
    </ul>

    <h2>2. 개인정보의 이용 목적</h2>
    <p>수집된 개인정보는 다음의 목적으로 이용됩니다.</p>

    <ul>
      <li>회원 및 활동 참여자 관리</li>
      <li>단체 활동 운영 및 관련 안내</li>
      <li>회원 간 연락 및 원활한 소통</li>
      <li>행사 및 프로그램 운영</li>
    </ul>

    <p>
      수집한 개인정보는 위 목적 이외의 용도로 이용하지 않습니다.
    </p>

    <h2>3. 개인정보의 보유 및 파기</h2>
    <p>
      WYEA는 개인정보의 이용 목적이 달성되거나 해당 정보를 보유할 필요가 없어진 경우
      지체 없이 개인정보를 파기합니다.
      다만, 관계 법령에 따라 일정 기간 보관이 필요한 경우에는
      해당 법령에서 정한 기간 동안 보관할 수 있습니다.
    </p>

    <h2>4. 개인정보의 제3자 제공</h2>
    <p>
      WYEA는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다.
      다만, 다음의 경우에는 예외로 할 수 있습니다.
    </p>

    <ul>
      <li>정보주체가 사전에 동의한 경우</li>
      <li>법령에 따라 개인정보 제공이 요구되는 경우</li>
    </ul>

    <h2>5. 개인정보의 안전한 관리</h2>
    <p>
      WYEA는 개인정보의 분실, 유출, 훼손 및 무단 접근을 방지하기 위해
      필요한 관리적·기술적 보호조치를 취하며,
      개인정보를 안전하게 관리하기 위해 노력합니다.
    </p>

    <h2>6. 정보주체의 권리와 행사 방법</h2>
    <p>
      정보주체는 자신의 개인정보에 대해 열람, 정정, 삭제 또는 처리정지를 요구할 수 있습니다.
      개인정보 관련 문의 및 권리 행사는 아래 개인정보 보호책임자를 통해 요청할 수 있습니다.
    </p>

    <h2>7. 개인정보 보호책임자</h2>

    <ul class="manager-info">
      <li><strong>성명:</strong> 이창현</li>
      <li><strong>직책:</strong> 대표</li>
      <li><strong>이메일:</strong> wyea@wyea.info</li>
    </ul>

    <h2>8. 개인정보 처리방침의 변경</h2>
    <p>
      본 개인정보 처리방침은 관련 법령 또는 WYEA의 개인정보 처리 내용이 변경되는 경우
      수정될 수 있으며, 변경사항은 본 웹사이트를 통해 안내합니다.
    </p>

    <p class="effective-date">
      시행일: 2025년 10월 2일
    </p>
  </section>
</template>

<style scoped>
.privacy-policy {
  max-width: clamp(800px, 41.56vw, 1064px);
  margin: clamp(7rem, 4.84vw, 9.3rem) auto;
  line-height: 1.6;
}

/* 메인 제목 */
.privacy-policy h1 {
  font-size: clamp(1.8rem, 0.94vw, 2.4rem);
  margin-bottom: clamp(1rem, 0.51vw, 1.3rem);
  font-weight: 700;
}

/* 1. 수집 및 이용하는 개인정보 등의 소제목 */
.privacy-policy h2 {
  margin-top: clamp(1.5rem, 0.78vw, 2rem);
  margin-bottom: 0.5rem;
  font-size: clamp(1.2rem, 0.63vw, 1.6rem);
  font-weight: 500;
}

/* 실제 본문 내용 */
.privacy-policy p {
  margin: 0.4rem 0;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* 개인정보 항목 등의 목록 */
.privacy-policy ul {
  margin: 0.5rem 0 1rem;
  padding-left: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
}

.privacy-policy li {
  margin: 0.15rem 0;
}

.manager-info {
  list-style: none;
  padding-left: 0 !important;
}

.effective-date {
  margin-top: 2rem !important;
  font-weight: 500;
}

/* 모바일 */
@media (max-width: 1000px) {
  .privacy-policy {
    margin: 3rem 1rem;
  }

  .privacy-policy h1 {
    font-size: 1.5rem;
    margin-bottom: 0.8rem;
  }

  .privacy-policy h2 {
    font-size: 1.05rem;
    margin-top: 1.2rem;
  }

  .privacy-policy p,
  .privacy-policy ul {
    font-size: 0.9rem;
    line-height: 1.5;
  }
}
</style>
