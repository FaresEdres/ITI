<template>
  <table class="table table-bordered table-striped w-100 text-center">
    <thead>
       <tr>
        <th>ID</th>
        <th>Name</th>
        <th>City</th>
       </tr>
    </thead>
    <tbody>
    <tr v-for="student in students" :key="student.id" > 
        <th>{{student.id}}</th>
        <th>{{ student.name }}</th>
        <th>{{student.city}}</th>
       </tr>

    </tbody>
    <tfoot>
      <tr>
        <th colspan="3">
          Number of students = {{ students.length }} 
        </th>
      </tr>
    </tfoot>


  </table>
      <button 
      type="button" 
      class="btn btn-primary" 
      data-bs-toggle="modal" 
      data-bs-target="#exampleModal"
    >
        
        Add Student
    </button>
</template>

<script>
import students from '@/students';
export default {
data:()=>({
  students:students
})
}
</script>

<style>

</style>