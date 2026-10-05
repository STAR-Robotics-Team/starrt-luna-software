# Defines ctre_phoenix5_vendor::phoenix5. Link against it to use CTRE Phoenix 5:
#
#   find_package(ctre_phoenix5_vendor REQUIRED)
#   target_link_libraries(my_node ctre_phoenix5_vendor::phoenix5)

find_package(Threads REQUIRED)

get_filename_component(_ctre_prefix "${ctre_phoenix5_vendor_DIR}/../../.." ABSOLUTE)

if(NOT TARGET ctre_phoenix5_vendor::phoenix5)
  foreach(_ctre_lib CTRE_Phoenix CTRE_PhoenixCCI CTRE_PhoenixTools)
    add_library(ctre_phoenix5_vendor::${_ctre_lib} SHARED IMPORTED)
    set_target_properties(ctre_phoenix5_vendor::${_ctre_lib} PROPERTIES
      IMPORTED_LOCATION "${_ctre_prefix}/lib/lib${_ctre_lib}.so")
  endforeach()

  add_library(ctre_phoenix5_vendor::phoenix5 INTERFACE IMPORTED)
  set_target_properties(ctre_phoenix5_vendor::phoenix5 PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES "${_ctre_prefix}/include/ctre_phoenix5_vendor"
    # Without this, ctre/Phoenix.h expects WPILib (the FRC robot library).
    INTERFACE_COMPILE_DEFINITIONS "Phoenix_No_WPI"
    # The Phoenix headers use C++20 features such as operator<=>.
    INTERFACE_COMPILE_FEATURES "cxx_std_20"
    INTERFACE_LINK_LIBRARIES
      "ctre_phoenix5_vendor::CTRE_Phoenix;ctre_phoenix5_vendor::CTRE_PhoenixCCI;ctre_phoenix5_vendor::CTRE_PhoenixTools;Threads::Threads")
endif()

unset(_ctre_prefix)
