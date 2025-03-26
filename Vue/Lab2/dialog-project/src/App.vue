<template>
  <h1>Open Source Track</h1>
<tablecomponent/>

<modaldialogcomponent/>
</template>

<script>
import tablecomponent from './components/tablecomponent.vue';
import modaldialogcomponent from './components/modaldialogcomponent.vue';
import students from './students';
export default {
components:{tablecomponent,modaldialogcomponent},
data:()=>({
isModalVisible:false,
students,students
}),
methods:{
    
  /*addData(student){
    students.push(student);
  }*/
}
}
</script>

<style>

</style>