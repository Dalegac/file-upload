<template>
  <div >
    <form method="post" action="http://localhost:7001/upload" enctype="multipart/form-data">
      <input type="file" name="file" /> 
      <button type="submit">上 传</button>
    </form>
  </div>
</template>

<script>

export default {
  name: "app",
};
</script>

<style>

</style>
